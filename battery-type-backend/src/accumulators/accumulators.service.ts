import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Accumulator } from './entities/accumulator.entity';
import { AccumulatorStatus } from './entities/accumulator-status.enum';
import { Like } from '../likes/like.entity';

@Injectable()
export class AccumulatorsService {
  constructor(
    @InjectRepository(Accumulator)
    private accumulatorRepository: Repository<Accumulator>,
  ) {}

  // ПЛИТКА — список через ORM, с фильтром и счётчиком лайков
  async findPublished(minCapacityMah?: number): Promise<any[]> {
    const qb = this.accumulatorRepository
      .createQueryBuilder('a')
      .where('a.status = :status', { status: AccumulatorStatus.PUBLISHED });

    if (minCapacityMah) {
      qb.andWhere('a.capacityMah >= :min', { min: minCapacityMah });
    }

    qb.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(*)')
        .from(Like, 'l')
        .where('l.accumulator_id = a.id');
    }, 'likesCount');

    const { entities, raw } = await qb.orderBy('a.id', 'ASC').getRawAndEntities();

    return entities.map((entity, index) => ({
      ...entity,
      likesCount: parseInt(raw[index]?.likesCount ?? '0', 10),
    }));
  }

  // ДОБАВЛЕНИЕ — есть ли у пользователя черновик (ORM)
  async findDraftByUser(userId: number): Promise<Accumulator | null> {
    return this.accumulatorRepository.findOne({
      where: { creator: { id: userId }, status: AccumulatorStatus.DRAFT },
    });
  }

  // Кнопка "Далее" — создать/обновить черновик (ORM)
  async createOrUpdateDraft(userId: number, modelName: string): Promise<Accumulator> {
    const existing = await this.findDraftByUser(userId);
    if (existing) {
      existing.modelName = modelName;
      return this.accumulatorRepository.save(existing);
    }
    const draft = this.accumulatorRepository.create({
      modelName,
      status: AccumulatorStatus.DRAFT,
      creator: { id: userId } as any,
    });
    return this.accumulatorRepository.save(draft);
  }

  // Кнопка "Опубликовать" — публикация черновика (ORM)
  async publishDraft(
    userId: number,
    shortDescription: string,
    capacityMah: number,
    nominalVoltageV: number,
  ): Promise<Accumulator | null> {
    const draft = await this.findDraftByUser(userId);
    if (!draft) return null;
    draft.shortDescription = shortDescription;
    draft.capacityMah = capacityMah;
    draft.nominalVoltageV = nominalVoltageV;
    draft.status = AccumulatorStatus.PUBLISHED;
    draft.publishedAt = new Date();
    return this.accumulatorRepository.save(draft);
  }

  /**
   * ЛЕНТА — получаем СРАЗУ ОДНУ строку через курсор (raw SQL),
   * без выборки всей таблицы и фильтрации в коде.
   */
  async getFeedItem(id?: number, next?: boolean): Promise<any | null> {
    let targetId = id;

    if (next && id) {
      const nextRow = await this.accumulatorRepository.query(
        `SELECT id FROM accumulators
         WHERE status = 'published' AND id > $1
         ORDER BY id ASC LIMIT 1`,
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
              (SELECT COUNT(*) FROM likes l WHERE l.accumulator_id = a.id) AS "likesCount"
       FROM accumulators a
       WHERE a.id = $1 AND a.status = 'published'`,
      [targetId],
    );
    return rows[0] ?? null;
  }

  // Логическое удаление — ТОЛЬКО raw SQL UPDATE, без ORM
  async deleteAccumulator(id: number): Promise<void> {
    await this.accumulatorRepository.query(
      `UPDATE accumulators SET status = 'deleted' WHERE id = $1`,
      [id],
    );
  }
}
