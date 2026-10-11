import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accumulator } from './entities/accumulator.entity';
import { AccumulatorStatus } from './entities/accumulator-status.enum';
import { Like } from '../likes/like.entity';
import { MinioService } from '../minio/minio.service';
import { CurrentUserProvider } from '../common/current-user.provider';
import { AccumulatorResponseDto } from './dto/accumulator-response.dto';

@Injectable()
export class AccumulatorsService {
  constructor(
    @InjectRepository(Accumulator)
    private accumulatorRepository: Repository<Accumulator>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    private minioService: MinioService,
  ) {}

  private currentUserId(): number {
    return CurrentUserProvider.getInstance().getCurrentUserId();
  }

  private toDto(entity: any, likesCount: number): AccumulatorResponseDto {
    return {
      id: entity.id,
      modelName: entity.modelName,
      shortDescription: entity.shortDescription ?? null,
      imageUrl: this.minioService.buildUrl(entity.imageUrl),
      videoUrl: this.minioService.buildUrl(entity.videoUrl),
      capacityMah: entity.capacityMah ?? null,
      nominalVoltageV: entity.nominalVoltageV !== null && entity.nominalVoltageV !== undefined
        ? Number(entity.nominalVoltageV)
        : null,
      likesCount,
      isMine: entity.creator?.id === this.currentUserId() ? 1 : 0,
    };
  }

  // GET список (только опубликованные), с фильтром по ёмкости + isMine
  async findPublished(minCapacityMah?: number): Promise<AccumulatorResponseDto[]> {
    const qb = this.accumulatorRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.creator', 'creator')
      .where('a.status = :status', { status: AccumulatorStatus.PUBLISHED });

    if (minCapacityMah) {
      qb.andWhere('a.capacityMah >= :min', { min: minCapacityMah });
    }

    qb.addSelect((sub) =>
      sub.select('COUNT(*)').from(Like, 'l').where('l.accumulator_id = a.id'),
      'likesCount',
    );

    const { entities, raw } = await qb.orderBy('a.id', 'ASC').getRawAndEntities();

    return entities.map((entity, i) =>
      this.toDto(entity, parseInt(raw[i]?.likesCount ?? '0', 10)),
    );
  }

  // GET лента — 1 строка через курсор (raw SQL)
  async getFeedItem(id?: number, next?: boolean): Promise<AccumulatorResponseDto | null> {
    let targetId = id;

    if (next && id) {
      const nextRow = await this.accumulatorRepository.query(
        `SELECT id FROM accumulators WHERE status = 'published' AND id > $1 ORDER BY id ASC LIMIT 1`,
        [id],
      );
      targetId = nextRow[0]?.id ?? id;
    }

    if (!targetId) {
      const firstRow = await this.accumulatorRepository.query(
        `SELECT id FROM accumulators WHERE status = 'published' ORDER BY id ASC LIMIT 1`,
      );
      targetId = firstRow[0]?.id;
    }

    if (!targetId) return null;

    const rows = await this.accumulatorRepository.query(
      `SELECT a.id, a.model_name AS "modelName", a.short_description AS "shortDescription",
              a.image_url AS "imageUrl", a.video_url AS "videoUrl",
              a.capacity_mah AS "capacityMah", a.nominal_voltage_v AS "nominalVoltageV",
              a.creator_id AS "creatorId",
              (SELECT COUNT(*) FROM likes l WHERE l.accumulator_id = a.id) AS "likesCount"
       FROM accumulators a
       WHERE a.id = $1 AND a.status = 'published'`,
      [targetId],
    );
    const row = rows[0];
    if (!row) return null;

    return {
      id: row.id,
      modelName: row.modelName,
      shortDescription: row.shortDescription ?? null,
      imageUrl: this.minioService.buildUrl(row.imageUrl),
      videoUrl: this.minioService.buildUrl(row.videoUrl),
      capacityMah: row.capacityMah ?? null,
      nominalVoltageV: row.nominalVoltageV !== null ? Number(row.nominalVoltageV) : null,
      likesCount: parseInt(row.likesCount ?? '0', 10),
      isMine: row.creatorId === this.currentUserId() ? 1 : 0,
    };
  }

  // GET черновик текущего пользователя (не более 1)
  async getDraft(): Promise<AccumulatorResponseDto | null> {
    const draft = await this.accumulatorRepository.findOne({
      where: { creator: { id: this.currentUserId() }, status: AccumulatorStatus.DRAFT },
      relations: { creator: true },
    });
    if (!draft) return null;
    return this.toDto(draft, 0);
  }

  // POST добавление + файлы
  async createDraft(
    modelName: string,
    imageFile?: Express.Multer.File,
    videoFile?: Express.Multer.File,
  ): Promise<AccumulatorResponseDto> {
    const userId = this.currentUserId();

    const existing = await this.accumulatorRepository.findOne({
      where: { creator: { id: userId }, status: AccumulatorStatus.DRAFT },
    });
    if (existing) {
      throw new BadRequestException();
    }

    let imageKey: string | undefined;
    let videoKey: string | undefined;
    if (imageFile) {
      imageKey = await this.minioService.uploadFile(imageFile.buffer, imageFile.originalname, 'img');
    }
    if (videoFile) {
      videoKey = await this.minioService.uploadFile(videoFile.buffer, videoFile.originalname, 'vid');
    }

    const draft = this.accumulatorRepository.create({
      modelName,
      status: AccumulatorStatus.DRAFT,
      imageUrl: imageKey,
      videoUrl: videoKey,
      creator: { id: userId } as any,
    });
    const saved = await this.accumulatorRepository.save(draft);
    return this.toDto({ ...saved, creator: { id: userId } }, 0);
  }

  // PUT публикация (только свой черновик -> published)
  async publish(
    id: number,
    shortDescription: string,
    capacityMah: number,
    nominalVoltageV: number,
  ): Promise<AccumulatorResponseDto> {
    const userId = this.currentUserId();
    const draft = await this.accumulatorRepository.findOne({
      where: { id },
      relations: { creator: true },
    });

    if (!draft) throw new NotFoundException();
    if (draft.creator.id !== userId) throw new ForbiddenException();
    if (draft.status !== AccumulatorStatus.DRAFT) throw new BadRequestException();

    draft.shortDescription = shortDescription;
    draft.capacityMah = capacityMah;
    draft.nominalVoltageV = nominalVoltageV;
    draft.status = AccumulatorStatus.PUBLISHED;
    draft.publishedAt = new Date();
    draft.moderator = { id: userId } as any;

    const saved = await this.accumulatorRepository.save(draft);
    return this.toDto(saved, 0);
  }

  // DELETE — только свои, soft delete через raw SQL UPDATE
  async remove(id: number): Promise<void> {
    const userId = this.currentUserId();
    const accumulator = await this.accumulatorRepository.findOne({
      where: { id },
      relations: { creator: true },
    });

    if (!accumulator || accumulator.status === AccumulatorStatus.DELETED) {
      throw new NotFoundException();
    }
    if (accumulator.creator.id !== userId) {
      throw new ForbiddenException();
    }

    await this.accumulatorRepository.query(
      `UPDATE accumulators SET status = 'deleted', completed_at = now() WHERE id = $1`,
      [id],
    );
  }

  // POST like — 0/1
  async setLike(accumulatorId: number, like: number): Promise<void> {
    const userId = this.currentUserId();

    const existing = await this.likeRepository.findOne({
      where: { user: { id: userId }, accumulator: { id: accumulatorId } },
    });

    if (like === 1 && !existing) {
      const newLike = this.likeRepository.create({
        user: { id: userId } as any,
        accumulator: { id: accumulatorId } as any,
      });
      await this.likeRepository.save(newLike);
    } else if (like === 0 && existing) {
      await this.likeRepository.remove(existing);
    }
  }
}
