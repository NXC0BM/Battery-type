import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { BatteryType } from './entities/battery_type.entity';
import { BatteryTypeStatus } from './entities/battery_type-status.enum';
import { Like } from '../likes/like.entity';

@Injectable()
export class BatteryTypeService {
  constructor(
    @InjectRepository(BatteryType)
    private battery_typeRepository: Repository<BatteryType>,
  ) {}

  // ПЛИТКА — список через ORM, с фильтром и счётчиком лайков
  async findPublished(minCapacityMah?: number): Promise<any[]> {
    const qb = this.battery_typeRepository
      .createQueryBuilder('a')
      .where('a.status = :status', { status: BatteryTypeStatus.PUBLISHED });

    if (minCapacityMah) {
      qb.andWhere('a.capacityMah >= :min', { min: minCapacityMah });
    }

    qb.addSelect((subQuery) => {
      return subQuery
        .select('COUNT(*)')
        .from(Like, 'l')
        .where('l.battery_type_id = a.id');
    }, 'likesCount');

    const { entities, raw } = await qb.orderBy('a.id', 'ASC').getRawAndEntities();

    return entities.map((entity, index) => ({
      ...entity,
      likesCount: parseInt(raw[index]?.likesCount ?? '0', 10),
    }));
  }

  // ДОБАВЛЕНИЕ — есть ли у пользователя черновик (ORM)
  async findDraftByUser(userId: number): Promise<BatteryType | null> {
    return this.battery_typeRepository.findOne({
      where: { creator: { id: userId }, status: BatteryTypeStatus.DRAFT },
    });
  }

    // Кнопка "Далее" — создать/обновить черновик (ORM) + сохранить пути к файлам
  async createOrUpdateDraft(
    userId: number,
    modelName: string,
    imageUrl?: string,
    videoUrl?: string,
  ): Promise<BatteryType> {
    const existing = await this.findDraftByUser(userId);
    if (existing) {
      existing.modelName = modelName;
      if (imageUrl) existing.imageUrl = imageUrl;
      if (videoUrl) existing.videoUrl = videoUrl;
      return this.battery_typeRepository.save(existing);
    }
    const draft = this.battery_typeRepository.create({
      modelName,
      status: BatteryTypeStatus.DRAFT,
      imageUrl,
      videoUrl,
      creator: { id: userId } as any,
    });
    return this.battery_typeRepository.save(draft);
  }

  // Кнопка "Опубликовать" — публикация черновика (ORM)
  async publishDraft(
    userId: number,
    shortDescription: string,
    capacityMah: number,
    nominalVoltageV: number,
  ): Promise<BatteryType | null> {
    const draft = await this.findDraftByUser(userId);
    if (!draft) return null;
    draft.shortDescription = shortDescription;
    draft.capacityMah = capacityMah;
    draft.nominalVoltageV = nominalVoltageV;
    draft.status = BatteryTypeStatus.PUBLISHED;
    draft.publishedAt = new Date();
    return this.battery_typeRepository.save(draft);
  }

  // ORM: БД возвращает одну опубликованную запись, не всю коллекцию.
  async getFeedItem(id?: number, next = false): Promise<any | null> {
    const qb = this.battery_typeRepository.createQueryBuilder('b').where('b.status = :status',{status: BatteryTypeStatus.PUBLISHED});
    if (id !== undefined) qb.andWhere(next ? 'b.id > :id' : 'b.id = :id',{id});
    const row = await qb.orderBy('b.id','ASC').take(1).getOne();
    if (!row && next) return this.getFeedItem();
    if (!row) return null;
    const result = await this.battery_typeRepository.manager.getRepository(Like).count({where:{battery_type:{id:row.id}}});
    return {...row,likesCount:result};
  }

  // Логическое удаление — ТОЛЬКО raw SQL UPDATE, без ORM
  async deleteBatteryType(id: number): Promise<void> {
    await this.battery_typeRepository.query(
      `UPDATE battery_type SET status = 'deleted' WHERE id = $1`,
      [id],
    );
  }
}
