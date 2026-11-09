import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { BatteryType } from '../battery_type/entities/battery_type.entity';

@Entity('likes')
@Unique(['user', 'battery_type'])
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => BatteryType, (battery_type) => battery_type.likes, { onDelete: 'RESTRICT' })  @JoinColumn({ name: 'battery_type_id' })
  battery_type: BatteryType;
}
