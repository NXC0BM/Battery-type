import { Injectable } from '@nestjs/common';
import { BatteryType } from './entities/battery_type.entity';
import { BatteryTypeStatus } from './entities/battery_type-status.enum';
import { MinioService } from '../minio/minio.service';

@Injectable()
export class BatteryTypeService {
  // Коллекция — просто массив в памяти, без БД (по заданию sprint 1)
  private battery_type: BatteryType[] = [
    {
      id: 1,
      modelName: 'Samsung INR18650-25R',
      chemistryType: 'Li-ion',
      capacityMah: 2500,
      nominalVoltageV: 3.6,
      description:
        'Высокотоковый цилиндрический аккумулятор 18650 для мощных устройств.',
      imageKey: 'acc-samsung-25r.jpg',
      videoKey: 'acc-samsung-25r.mp4',
      status: BatteryTypeStatus.PUBLISHED,
      likesCount: 3,
    },
    {
      id: 2,
      modelName: 'LG HG2 18650',
      chemistryType: 'Li-ion',
      capacityMah: 3000,
      nominalVoltageV: 3.6,
      description: 'Аккумулятор с высокой токоотдачей, часто применяется в фонарях.',
      imageKey: 'acc-lg-hg2.jpg',
      videoKey: 'acc-lg-hg2.mp4',
      status: BatteryTypeStatus.PUBLISHED,
      likesCount: 1,
    },
    {
      id: 3,
      modelName: 'Panasonic NCR18650B',
      chemistryType: 'Li-ion',
      capacityMah: 3350,
      nominalVoltageV: 3.6,
      description: 'Один из самых ёмких 18650-элементов на рынке.',
      imageKey: 'acc-panasonic-ncr18650b.jpg',
      videoKey: 'acc-panasonic-ncr18650b.mp4',
      status: BatteryTypeStatus.PUBLISHED,
      likesCount: 2,
    },
    {
      id: 4,
      modelName: 'Ni-MH AA Eneloop',
      chemistryType: 'Ni-MH',
      capacityMah: 1900,
      nominalVoltageV: 1.2,
      description: 'Пальчиковый аккумулятор с низким саморазрядом.',
      imageKey: 'acc-nimh-eneloop.jpg',
      videoKey: 'acc-nimh-eneloop.mp4',
      status: BatteryTypeStatus.PUBLISHED,
      likesCount: 4,
    },
    {
      id: 5,
      modelName: 'Varta Industrial Ni-MH C 5000mAh',
      chemistryType: 'Ni-MH',
      capacityMah: 5000,
      nominalVoltageV: 1.2,
      description: 'Промышленный аккумулятор формата C повышенной ёмкости.',
      imageKey: 'acc-varta-industrial-c.jpg',
      videoKey: 'acc-varta-industrial-c.mp4',
      status: BatteryTypeStatus.PUBLISHED,
      likesCount: 2,
    },
    {
      id: 6,
      modelName: 'Ace Power LiPo 3.7V 2200mAh',
      chemistryType: 'Li-Po',
      capacityMah: 2200,
      nominalVoltageV: 3.7,
      description: 'Плоский LiPo-аккумулятор для компактных устройств.',
      imageKey: 'acc-ace-power-lipo-2200.jpg',
      videoKey: 'acc-ace-power-lipo-2200.mp4',
      status: BatteryTypeStatus.PUBLISHED,
      likesCount: 5,
    },
    {
      id: 7,
      modelName: 'Sony VTC6 18650',
      chemistryType: 'Li-ion',
      capacityMah: 3000,
      nominalVoltageV: 3.7,
      description: 'Высокотоковый аккумулятор, популярен в электронных устройствах.',
      imageKey: 'acc-sony-vtc6.jpg',
      videoKey: 'acc-sony-vtc6.mp4',
      status: BatteryTypeStatus.PUBLISHED,
      likesCount: 1,
    },
    {
      id: 8,
      modelName: 'LiPo Pouch 3.7V 5000mAh',
      chemistryType: 'Li-Po',
      capacityMah: 5000,
      nominalVoltageV: 3.7,
      description: 'Аккумулятор-пауч для компактных устройств с высоким током разряда.',
      imageKey: 'acc-lipo-5000.jpg',
      videoKey: 'acc-lipo-5000.mp4',
      status: BatteryTypeStatus.DRAFT,
      likesCount: 0,
    },
  ];

  constructor(private readonly minioService: MinioService) {}

  private toView(acc: BatteryType, currentMinCapacityMah?: number) {
    return {
      id: acc.id,
      modelName: acc.modelName,
      chemistryType: acc.chemistryType,
      capacityMah: acc.capacityMah,
      nominalVoltageV: acc.nominalVoltageV,
      description: acc.description,
      imageUrl: this.minioService.buildUrl(acc.imageKey),
      videoUrl: this.minioService.buildUrl(acc.videoKey),
      likesCount: acc.likesCount,
      currentMinCapacityMah: currentMinCapacityMah ?? '',
    };
  }

  // GET /battery_type — страница "Плитка"
  findPublished(minCapacityMah?: number) {
    return this.battery_type
      .filter((a) => a.status === BatteryTypeStatus.PUBLISHED)
      .filter((a) => (minCapacityMah ? a.capacityMah >= minCapacityMah : true))
      .map((a) => this.toView(a, minCapacityMah));
  }

  // GET /battery_type/draft — страница "Добавление"
  findDraft() {
    const draft = this.battery_type.find(
      (a) => a.status === BatteryTypeStatus.DRAFT,
    );
    return draft ? this.toView(draft) : null;
  }

  // GET /battery_type/:id — страница "Лента"
  findOnePublished(id: number) {
    const acc = this.battery_type.find(
      (a) => a.id === id && a.status === BatteryTypeStatus.PUBLISHED,
    );
    return acc ? this.toView(acc) : null;
  }

  // GET /battery_type/:id?next=true — следующий опубликованный после id
  findNextAfter(id: number) {
    const published = this.battery_type.filter(
      (a) => a.status === BatteryTypeStatus.PUBLISHED,
    );
    const currentIndex = published.findIndex((a) => a.id === id);
    const nextIndex =
      currentIndex === -1 ? 0 : (currentIndex + 1) % published.length;
    return this.toView(published[nextIndex]);
  }
}
