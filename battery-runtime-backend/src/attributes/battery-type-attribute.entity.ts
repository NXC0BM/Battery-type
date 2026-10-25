import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { BatteryType } from '../battery_type/entities/battery-type.entity';
import { Attribute } from './attribute.entity';

// Вертикальная таблица значений (EAV: "Value") — связь М-М между услугами и атрибутами
// со значением атрибута для конкретной услуги.
@Entity('battery_type_attributes')
@Unique(['batteryType', 'attribute'])
export class BatteryTypeAttribute {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => BatteryType, (batteryType) => batteryType.attributes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'battery_type_id' })
  batteryType: BatteryType;

  @ManyToOne(() => Attribute, (attribute) => attribute.values, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'attribute_id' })
  attribute: Attribute;

  @Column({ type: 'varchar', length: 255 })
  value: string;
}
