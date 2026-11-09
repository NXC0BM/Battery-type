import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { BatteryType } from './entities/battery-type.entity';
import { BatteryTypeStatus } from './entities/battery-type-status.enum';
import { Like } from '../likes/like.entity';
import { Attribute } from '../attributes/attribute.entity';
import { BatteryTypeAttribute } from '../attributes/battery-type-attribute.entity';
import { MinioService } from '../minio/minio.service';
import { AttributeValueDto } from './dto/attribute-value.dto';

@Injectable()
export class BatteryTypeService {
  constructor(
    @InjectRepository(BatteryType) private batteryTypeRepository: Repository<BatteryType>,
    @InjectRepository(Like) private likeRepository: Repository<Like>,
    private minioService: MinioService,
  ) {}

  private query(userId?: number) {
    return this.batteryTypeRepository.createQueryBuilder('b').leftJoinAndSelect('b.creator', 'creator');
  }

  private async toDto(entity: any, userId?: number) {
    const attributes = await this.getAttributes(entity.id);
    const likesCount = await this.likeRepository.count({ where: { batteryType: { id: entity.id } } });
    const isLiked = userId ? await this.likeRepository.exists({ where: { batteryType: { id: entity.id }, user: { id: userId } } }) : false;
    const numberValue = (code: string) => {
      const attr = attributes.find((a: any) => a.code === code);
      return attr?.value === '' || attr?.value == null ? null : Number(attr.value);
    };
    return {
      id: entity.id, modelName: entity.modelName, shortDescription: entity.shortDescription ?? null,
      imageUrl: this.minioService.buildUrl(entity.imageUrl), videoUrl: this.minioService.buildUrl(entity.videoUrl),
      capacityMah: numberValue('capacity_mah'), nominalVoltageV: numberValue('nominal_voltage_v'),
      likesCount,
      isMine: userId && entity.creator?.id === userId ? 1 : 0,
      isLiked: isLiked ? 1 : 0, attributes,
    };
  }

  async findPublished(minCapacityMah?: number, userId?: number) {
    const qb = this.query(userId).where('b.status = :status', { status: BatteryTypeStatus.PUBLISHED });
    if (minCapacityMah !== undefined) {
      qb.andWhere(`EXISTS (SELECT 1 FROM battery_type_attributes v JOIN attributes a ON a.id = v.attribute_id
        WHERE v.battery_type_id = b.id AND a.code = 'capacity_mah'
        AND CASE WHEN v.value ~ '^[0-9]+([.][0-9]+)?$' THEN v.value::numeric END >= :minimum)`, { minimum: minCapacityMah });
    }
    return Promise.all((await qb.orderBy('b.id', 'ASC').getMany()).map(row => this.toDto(row, userId)));
  }

  async getFeedItem(id?: number, next = false, userId?: number): Promise<any> {
    const qb = this.query(userId).where('b.status = :status', { status: BatteryTypeStatus.PUBLISHED });
    if (id !== undefined) qb.andWhere(next ? 'b.id > :id' : 'b.id = :id', { id });
    const row = await qb.orderBy('b.id', 'ASC').take(1).getOne();
    if (!row && next) return this.getFeedItem(undefined, false, userId);
    if (!row && id !== undefined) throw new NotFoundException('Тип аккумулятора не найден');
    return row ? this.toDto(row, userId) : null;
  }

  async getAttributes(batteryTypeId: number): Promise<any[]> {
    // LEFT JOIN от справочника показывает новый атрибут у всех типов аккумуляторов.
    return this.batteryTypeRepository.query(`SELECT a.id, a.code, a.name, COALESCE(v.value, '') AS value, a.unit
      FROM attributes a LEFT JOIN battery_type_attributes v
      ON v.attribute_id = a.id AND v.battery_type_id = $1 ORDER BY a.id`, [batteryTypeId]);
  }

  private async saveValue(manager: EntityManager, batteryTypeId: number, attributeId: number, value: string) {
    const repository = manager.getRepository(BatteryTypeAttribute);
    const where = { batteryType: { id: batteryTypeId }, attribute: { id: attributeId } };
    if (value === '') { await repository.delete(where); return; }
    await repository.upsert({ ...where, value }, { conflictPaths: ['batteryType', 'attribute'] });
  }

  async getDraft(userId: number) {
    const row = await this.query(userId).where('b.creator_id = :userId AND b.status = :status',
      { userId, status: BatteryTypeStatus.DRAFT }).getOne();
    return row ? this.toDto(row, userId) : null;
  }

  async createDraft(modelName: string, userId: number, image?: Express.Multer.File, video?: Express.Multer.File) {
    if (!modelName?.trim() || modelName.length > 100) throw new BadRequestException('Укажите модель до 100 символов');
    if (await this.getDraft(userId)) throw new BadRequestException('Черновик уже существует');
    const imageKey = image ? await this.minioService.uploadFile(image.buffer, image.originalname, 'img') : null;
    const videoKey = video ? await this.minioService.uploadFile(video.buffer, video.originalname, 'vid') : null;
    const saved = await this.batteryTypeRepository.save(this.batteryTypeRepository.create({
      modelName: modelName.trim(), status: BatteryTypeStatus.DRAFT, imageUrl: imageKey, videoUrl: videoKey, creator: { id: userId },
    }));
    return this.toDto({ ...saved, creator: { id: userId } }, userId);
  }

  async publish(id: number, userId: number, shortDescription: string, capacityMah: number,
    nominalVoltageV: number, attributes: AttributeValueDto[] = []) {
    await this.batteryTypeRepository.manager.transaction(async manager => {
      const repository = manager.getRepository(BatteryType);
      const draft = await repository.findOne({ where: { id }, relations: { creator: true } });
      if (!draft) throw new NotFoundException();
      if (draft.creator.id !== userId) throw new ForbiddenException();
      if (draft.status !== BatteryTypeStatus.DRAFT) throw new BadRequestException('Можно публиковать только черновик');
      for (const [code, value] of [['capacity_mah', capacityMah], ['nominal_voltage_v', nominalVoltageV]] as const) {
        const attr = await manager.getRepository(Attribute).findOneBy({ code });
        if (!attr) throw new BadRequestException('Сначала выполните миграцию атрибутов');
        await this.saveValue(manager, id, attr.id, String(value));
      }
      for (const value of attributes) {
        const attr = await manager.getRepository(Attribute).findOneBy({ name: value.name });
        if (!attr || ['capacity_mah', 'nominal_voltage_v'].includes(attr.code))
          throw new BadRequestException('Неизвестный атрибут или повтор ёмкости/напряжения');
        await this.saveValue(manager, id, attr.id, value.value);
      }
      draft.shortDescription = shortDescription;
      draft.status = BatteryTypeStatus.PUBLISHED;
      draft.publishedAt = new Date();
      await repository.save(draft);
    });
    return this.getFeedItem(id, false, userId);
  }

  async remove(id: number, userId: number) {
    const row = await this.batteryTypeRepository.findOne({ where: { id }, relations: { creator: true } });
    if (!row || row.status === BatteryTypeStatus.DELETED) throw new NotFoundException();
    if (row.creator.id !== userId) throw new ForbiddenException();
    await this.batteryTypeRepository.query(`UPDATE battery_type SET status = 'deleted', completed_at = now() WHERE id = $1`, [id]);
  }

  async setLike(batteryTypeId: number, userId: number, like: number) {
    if (!await this.batteryTypeRepository.findOneBy({ id: batteryTypeId, status: BatteryTypeStatus.PUBLISHED }))
      throw new NotFoundException();
    const where = { user: { id: userId }, batteryType: { id: batteryTypeId } };
    if (like === 1) await this.likeRepository.upsert(where, { conflictPaths: ['user', 'batteryType'] });
    else await this.likeRepository.delete(where);
  }
}
