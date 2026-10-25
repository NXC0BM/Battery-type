import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BatteryTypeAttribute } from './battery-type-attribute.entity';

// Справочник атрибутов (EAV: "Attribute") — названия дополнительных характеристик услуги.
// Набор атрибутов можно расширять без изменения структуры таблицы battery_type.
@Entity('attributes')
export class Attribute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit: string;

  @OneToMany(() => BatteryTypeAttribute, (bta) => bta.attribute)
  values: BatteryTypeAttribute[];
}
