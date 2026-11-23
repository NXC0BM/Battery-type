import { BatteryTypeFeedService } from "./battery_type-feed.service";
import { RotationBatteryTypeDto } from "./dto/rotation-battery-type.dto";
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ServiceUnavailableException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import { BatteryType } from "./entities/battery-type.entity";
import { BatteryTypeStatus } from "./entities/battery-type-status.enum";
import { Like } from "../likes/like.entity";
import { Attribute } from "../attributes/attribute.entity";
import { BatteryTypeAttribute } from "../attributes/battery-type-attribute.entity";
import { MinioService } from "../minio/minio.service";
import { AttributeValueDto } from "./dto/attribute-value.dto";

@Injectable()
export class BatteryTypeService {
  constructor(
    @InjectRepository(BatteryType)
    private batteryTypeRepository: Repository<BatteryType>,
    @InjectRepository(Like) private likeRepository: Repository<Like>,
    private minioService: MinioService,
    private feed: BatteryTypeFeedService,
  ) {}

  private query(userId?: number) {
    return this.batteryTypeRepository
      .createQueryBuilder("b")
      .leftJoinAndSelect("b.creator", "creator");
  }

  private async toDto(entity: any, userId?: number) {
    const attributes = await this.getAttributes(entity.id);
    const likesCount = await this.likeRepository.count({
      where: { batteryType: { id: entity.id } },
    });
    const isLiked = userId
      ? await this.likeRepository.exists({
          where: { batteryType: { id: entity.id }, user: { id: userId } },
        })
      : false;
    const numberValue = (code: string) => {
      const attr = attributes.find((a: any) => a.code === code);
      return attr?.value === "" || attr?.value == null
        ? null
        : Number(attr.value);
    };
    return {
      id: entity.id,
      modelName: entity.modelName,
      shortDescription: entity.shortDescription ?? null,
      imageUrl: this.minioService.buildUrl(entity.imageUrl),
      videoUrl: this.minioService.buildUrl(entity.videoUrl),
      capacityMah: numberValue("capacity_mah"),
      nominalVoltageV: numberValue("nominal_voltage_v"),
      modelUrl: this.minioService.buildUrl(entity.modelUrl),
      shortDescriptionEn: entity.shortDescriptionEn,
      rotationX: entity.rotationX,
      rotationY: entity.rotationY,
      likesCount,
      isMine: userId && entity.creator?.id === userId ? 1 : 0,
      isLiked: isLiked ? 1 : 0,
      attributes,
    };
  }

  async findPublished(
    minCapacityMah?: number,
    userId?: number,
    page = 1,
    limit = 24,
  ) {
    const qb = this.query(userId).where("b.status = :status", {
      status: BatteryTypeStatus.PUBLISHED,
    });
    if (minCapacityMah !== undefined) {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM battery_type_attributes v JOIN attributes a ON a.id = v.attribute_id
        WHERE v.battery_type_id = b.id AND a.code = 'capacity_mah'
        AND CASE WHEN v.value ~ '^[0-9]+([.][0-9]+)?$' THEN v.value::numeric END >= :minimum)`,
        { minimum: minCapacityMah },
      );
    }
    const total = await qb.getCount();
    const items = await Promise.all(
      (
        await qb
          .orderBy("b.id", "ASC")
          .skip((page - 1) * limit)
          .take(limit)
          .getMany()
      ).map((row) => this.toDto(row, userId)),
    );
    return { items, total, page, limit };
  }

  async getFeedItem(
    id?: number,
    next = false,
    userId?: number,
    sessionId?: string,
  ): Promise<any> {
    let position: any = {};
    if (sessionId && (next || id === undefined)) {
      position = await this.feed.next(sessionId, next);
      id = position.id;
      if (id === undefined) return null;
    }
    const qb = this.query(userId).where("b.status = :status", {
      status: BatteryTypeStatus.PUBLISHED,
    });
    if (id !== undefined) qb.andWhere("b.id = :id", { id });
    let row = await qb.orderBy("b.id", "ASC").take(1).getOne();
    // A cached id may have been logically deleted since the batch was prepared.
    // Skip it during feed navigation, while direct reads of a deleted id stay 404.
    if (!row && sessionId && (next || position.feedPosition !== undefined)) {
      for (let attempt = 0; attempt < 100 && !row; attempt++) {
        position = await this.feed.next(sessionId, true);
        if (position.id === undefined) return null;
        row = await this.query(userId)
          .where("b.status = :status AND b.id = :id", {
            status: BatteryTypeStatus.PUBLISHED,
            id: position.id,
          })
          .getOne();
      }
    }
    if (!row && id !== undefined)
      throw new NotFoundException("Тип аккумулятора не найден");
    if (!row) return null;
    const result = { ...(await this.toDto(row, userId)), ...position };
    if (next) {
      try {
        const response = await fetch(
          (process.env.BATTERY_TYPE_ASYNC_URL || "http://127.0.0.1:53002") +
            "/battery_type/rotation",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ batteryTypeId: row.id }),
            signal: AbortSignal.timeout(5000),
          },
        );
        if (!response.ok) throw Error("HTTP " + response.status);
        result.rotationJob = await response.json();
      } catch (e) {
        throw new ServiceUnavailableException(
          "Асинхронный сервис battery_type недоступен",
        );
      }
    }
    return result;
  }

  async updateRotation(id: number, dto: RotationBatteryTypeDto) {
    const changed = await this.batteryTypeRepository.query(
      "UPDATE battery_type SET rotation_x=$2,rotation_y=$3 WHERE id=$1 AND status='published' AND rotation_x=$4 AND rotation_y=$5 RETURNING id",
      [id, dto.rotationX, dto.rotationY, dto.previousX, dto.previousY],
    );
    // pg returns [rows, affected] for UPDATE through TypeORM.
    if (!changed[0]?.length)
      throw new ConflictException(
        "Положение уже изменилось или тип не опубликован",
      );
    return this.getFeedItem(id);
  }

  async descriptions() {
    return this.batteryTypeRepository
      .query(`SELECT MIN(id)::integer AS id,short_description_en AS description
      FROM battery_type WHERE status='published' AND short_description_en IS NOT NULL
      GROUP BY short_description_en ORDER BY MIN(id)`);
  }

  async getAttributes(batteryTypeId: number): Promise<any[]> {
    // LEFT JOIN от справочника показывает новый атрибут у всех типов аккумуляторов.
    return this.batteryTypeRepository.query(
      `SELECT a.id, a.code, a.name, COALESCE(v.value, '') AS value, a.unit
      FROM attributes a LEFT JOIN battery_type_attributes v
      ON v.attribute_id = a.id AND v.battery_type_id = $1 ORDER BY a.id`,
      [batteryTypeId],
    );
  }

  private async saveValue(
    manager: EntityManager,
    batteryTypeId: number,
    attributeId: number,
    value: string,
  ) {
    const repository = manager.getRepository(BatteryTypeAttribute);
    const where = {
      batteryType: { id: batteryTypeId },
      attribute: { id: attributeId },
    };
    if (value === "") {
      await repository.delete(where);
      return;
    }
    await repository.upsert(
      { ...where, value },
      { conflictPaths: ["batteryType", "attribute"] },
    );
  }

  async getDraft(userId: number) {
    const row = await this.query(userId)
      .where("b.creator_id = :userId AND b.status = :status", {
        userId,
        status: BatteryTypeStatus.DRAFT,
      })
      .getOne();
    return row ? this.toDto(row, userId) : null;
  }

  async createDraft(
    modelName: string,
    userId: number,
    image?: Express.Multer.File,
    video?: Express.Multer.File,
    model?: Express.Multer.File,
  ) {
    if (!modelName?.trim() || modelName.length > 100)
      throw new BadRequestException("Укажите модель до 100 символов");
    if (await this.getDraft(userId))
      throw new BadRequestException("Черновик уже существует");
    if (model) {
      if (!/\.(glb|gltf)$/i.test(model.originalname))
        throw new BadRequestException("Модель: glb или gltf");
      if (/\.glb$/i.test(model.originalname)) {
        if (
          model.buffer.length < 12 ||
          model.buffer.toString("ascii", 0, 4) !== "glTF" ||
          model.buffer.readUInt32LE(4) !== 2 ||
          model.buffer.readUInt32LE(8) !== model.buffer.length
        )
          throw new BadRequestException("Некорректный файл GLB 2");
      } else {
        let document: any;
        try {
          document = JSON.parse(model.buffer.toString("utf8"));
        } catch {
          throw new BadRequestException("Некорректный JSON GLTF");
        }
        if (
          document.asset?.version !== "2.0" ||
          !Array.isArray(document.meshes)
        )
          throw new BadRequestException("Требуется модель GLTF 2");
        if (
          [...(document.buffers || []), ...(document.images || [])].some(
            (r: any) => r.uri && !r.uri.startsWith("data:"),
          )
        )
          throw new BadRequestException(
            "GLTF должен содержать ресурсы внутри файла; используйте GLB",
          );
      }
    }
    const imageKey = image
      ? await this.minioService.uploadFile(
          image.buffer,
          image.originalname,
          "img",
        )
      : null;
    const videoKey = video
      ? await this.minioService.uploadFile(
          video.buffer,
          video.originalname,
          "vid",
        )
      : null;
    const modelKey = model
      ? await this.minioService.uploadFile(
          model.buffer,
          model.originalname,
          "battery-type-model",
        )
      : null;
    const saved = await this.batteryTypeRepository.save(
      this.batteryTypeRepository.create({
        modelName: modelName.trim(),
        modelUrl: modelKey,
        rotationX: Math.random() * 2 * Math.PI,
        rotationY: Math.random() * 2 * Math.PI,
        status: BatteryTypeStatus.DRAFT,
        imageUrl: imageKey,
        videoUrl: videoKey,
        creator: { id: userId },
      }),
    );
    return this.toDto({ ...saved, creator: { id: userId } }, userId);
  }

  async publish(
    id: number,
    userId: number,
    shortDescription: string,
    capacityMah: number,
    nominalVoltageV: number,
    attributes: AttributeValueDto[] = [],
    shortDescriptionEn?: string,
  ) {
    await this.batteryTypeRepository.manager.transaction(async (manager) => {
      const repository = manager.getRepository(BatteryType);
      const draft = await repository.findOne({
        where: { id },
        relations: { creator: true },
      });
      if (!draft) throw new NotFoundException();
      if (draft.creator.id !== userId) throw new ForbiddenException();
      if (draft.status !== BatteryTypeStatus.DRAFT)
        throw new BadRequestException("Можно публиковать только черновик");
      for (const [code, value] of [
        ["capacity_mah", capacityMah],
        ["nominal_voltage_v", nominalVoltageV],
      ] as const) {
        const attr = await manager.getRepository(Attribute).findOneBy({ code });
        if (!attr)
          throw new BadRequestException("Сначала выполните миграцию атрибутов");
        await this.saveValue(manager, id, attr.id, String(value));
      }
      for (const value of attributes) {
        const attr = await manager
          .getRepository(Attribute)
          .findOneBy({ name: value.name });
        if (!attr || ["capacity_mah", "nominal_voltage_v"].includes(attr.code))
          throw new BadRequestException(
            "Неизвестный атрибут или повтор ёмкости/напряжения",
          );
        await this.saveValue(manager, id, attr.id, value.value);
      }
      draft.shortDescriptionEn = shortDescriptionEn || null;
      draft.shortDescription = shortDescription;
      draft.status = BatteryTypeStatus.PUBLISHED;
      draft.publishedAt = new Date();
      await repository.save(draft);
    });
    return this.getFeedItem(id, false, userId);
  }

  async remove(id: number, userId: number) {
    const row = await this.batteryTypeRepository.findOne({
      where: { id },
      relations: { creator: true },
    });
    if (!row || row.status === BatteryTypeStatus.DELETED)
      throw new NotFoundException();
    if (row.creator.id !== userId) throw new ForbiddenException();
    await this.batteryTypeRepository.query(
      `UPDATE battery_type SET status = 'deleted', completed_at = now() WHERE id = $1`,
      [id],
    );
  }

  async setLike(batteryTypeId: number, userId: number, like: number) {
    if (
      !(await this.batteryTypeRepository.findOneBy({
        id: batteryTypeId,
        status: BatteryTypeStatus.PUBLISHED,
      }))
    )
      throw new NotFoundException();
    const where = { user: { id: userId }, batteryType: { id: batteryTypeId } };
    if (like === 1)
      await this.likeRepository.upsert(where, {
        conflictPaths: ["user", "batteryType"],
      });
    else await this.likeRepository.delete(where);
  }
}
