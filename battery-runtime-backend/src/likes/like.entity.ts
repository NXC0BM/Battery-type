import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { BatteryType } from '../battery_type/entities/battery-type.entity';

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => BatteryType, (batteryType) => batteryType.likes, { onDelete: 'RESTRICT' })  @JoinColumn({ name: 'battery_type_id' })
  batteryType: BatteryType;
}
