import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BatteryType } from './entities/battery-type.entity';
import { BatteryTypeStatus } from './entities/battery-type-status.enum';
import { Like } from '../likes/like.entity';
import { MinioService } from '../minio/minio.service';
import { BatteryTypeResponseDto } from './dto/battery-type-response.dto';

@Injectable()
export class BatteryTypeService {
  constructor(
    @InjectRepository(BatteryType)
    private batteryTypeRepository: Repository<BatteryType>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    private minioService: MinioService,
  ) {}

  private toDto(
    entity: any,
    likesCount: number,
    currentUserId?: number,
  ): BatteryTypeResponseDto {
    return {
      id: entity.id,
      modelName: entity.modelName,
      shortDescription: entity.shortDescription ?? null,
      imageUrl: this.minioService.buildUrl(entity.imageUrl),
      videoUrl: this.minioService.buildUrl(entity.videoUrl),
      capacityMah: entity.capacityMah ?? null,
      nominalVoltageV:
        entity.nominalVoltageV !== null && entity.nominalVoltageV !== undefined
          ? Number(entity.nominalVoltageV)
          : null,
      likesCount,
      isMine: currentUserId && entity.creator?.id === currentUserId ? 1 : 0,
    };
  }

  // GET список
  async findPublished(
    minCapacityMah?: number,
    currentUserId?: number,
  ): Promise<BatteryTypeResponseDto[]> {
    const qb = this.batteryTypeRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.creator', 'creator')
      .where('a.status = :status', { status: BatteryTypeStatus.PUBLISHED });

    if (minCapacityMah) {
      qb.andWhere('a.capacityMah >= :min', { min: minCapacityMah });
    }

    qb.addSelect(
      (sub) =>
        sub.select('COUNT(*)').from(Like, 'l').where('l.battery_type_id = a.id'),
      'likesCount',
    );

    const { entities, raw } = await qb.orderBy('a.id', 'ASC').getRawAndEntities();

    return entities.map((entity, i) =>
      this.toDto(entity, parseInt(raw[i]?.likesCount ?? '0', 10), currentUserId),
    );
  }

  // GET лента
  async getFeedItem(
    id?: number,
    next?: boolean,
    currentUserId?: number,
  ): Promise<BatteryTypeResponseDto | null> {
    let targetId = id;

    if (next && id) {
      const nextRow = await this.batteryTypeRepository.query(
        `SELECT id FROM battery_type WHERE status = 'published' AND id > $1 ORDER BY id ASC LIMIT 1`,
        [id],
      );
      targetId = nextRow[0]?.id ?? id;
    }

    if (!targetId) {
      const firstRow = await this.batteryTypeRepository.query(
        `SELECT id FROM battery_type WHERE status = 'published' ORDER BY id ASC LIMIT 1`,
      );
      targetId = firstRow[0]?.id;
    }

    if (!targetId) return null;

    const rows = await this.batteryTypeRepository.query(
      `SELECT a.id, a.model_name AS "modelName", a.short_description AS "shortDescription",
              a.image_url AS "imageUrl", a.video_url AS "videoUrl",
              a.capacity_mah AS "capacityMah", a.nominal_voltage_v AS "nominalVoltageV",
              a.creator_id AS "creatorId",
              (SELECT COUNT(*) FROM likes l WHERE l.battery_type_id = a.id) AS "likesCount"
       FROM battery_type a
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
      isMine: currentUserId && row.creatorId === currentUserId ? 1 : 0,
    };
  }

  // GET черновик текущего пользователя
  async getDraft(userId: number): Promise<BatteryTypeResponseDto | null> {
    const draft = await this.batteryTypeRepository.findOne({
      where: { creator: { id: userId }, status: BatteryTypeStatus.DRAFT },
      relations: { creator: true },
    });
    if (!draft) return null;
    return this.toDto(draft, 0, userId);
  }

  // POST добавление + файлы
  async createDraft(
    modelName: string,
    userId: number,
    imageFile?: Express.Multer.File,
    videoFile?: Express.Multer.File,
  ): Promise<BatteryTypeResponseDto> {
    const existing = await this.batteryTypeRepository.findOne({
      where: { creator: { id: userId }, status: BatteryTypeStatus.DRAFT },
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

    const draft = this.batteryTypeRepository.create({
      modelName,
      status: BatteryTypeStatus.DRAFT,
      imageUrl: imageKey,
      videoUrl: videoKey,
      creator: { id: userId } as any,
    });
    const saved = await this.batteryTypeRepository.save(draft);
    return this.toDto({ ...saved, creator: { id: userId } }, 0, userId);
  }

  // PUT публикация (только свой черновик -> published)
  async publish(
    id: number,
    userId: number,
    shortDescription: string,
    capacityMah: number,
    nominalVoltageV: number,
  ): Promise<BatteryTypeResponseDto> {
    const draft = await this.batteryTypeRepository.findOne({
      where: { id },
      relations: { creator: true },
    });

    if (!draft) throw new NotFoundException();
    if (draft.creator.id !== userId) throw new ForbiddenException();
    if (draft.status !== BatteryTypeStatus.DRAFT) throw new BadRequestException();

    draft.shortDescription = shortDescription;
    draft.capacityMah = capacityMah;
    draft.nominalVoltageV = nominalVoltageV;
    draft.status = BatteryTypeStatus.PUBLISHED;
    draft.publishedAt = new Date();
    draft.moderator = { id: userId } as any;

    const saved = await this.batteryTypeRepository.save(draft);
    return this.toDto(saved, 0, userId);
  }

  // DELETE — только свои, soft delete через raw SQL UPDATE
  async remove(id: number, userId: number): Promise<void> {
    const batteryType = await this.batteryTypeRepository.findOne({
      where: { id },
      relations: { creator: true },
    });

    if (!batteryType || batteryType.status === BatteryTypeStatus.DELETED) {
      throw new NotFoundException();
    }
    if (batteryType.creator.id !== userId) {
      throw new ForbiddenException();
    }

    await this.batteryTypeRepository.query(
      `UPDATE battery_type SET status = 'deleted', completed_at = now() WHERE id = $1`,
      [id],
    );
  }

  // POST like — 0/1
  async setLike(batteryTypeId: number, userId: number, like: number): Promise<void> {
    const existing = await this.likeRepository.findOne({
      where: { user: { id: userId }, batteryType: { id: batteryTypeId } },
    });

    if (like === 1 && !existing) {
      const newLike = this.likeRepository.create({
        user: { id: userId } as any,
        batteryType: { id: batteryTypeId } as any,
      });
      await this.likeRepository.save(newLike);
    } else if (like === 0 && existing) {
      await this.likeRepository.remove(existing);
    }
  }
}
