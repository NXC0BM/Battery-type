import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Accumulator } from '../accumulators/entities/accumulator.entity';

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Accumulator, (accumulator) => accumulator.likes, { onDelete: 'RESTRICT' })  @JoinColumn({ name: 'accumulator_id' })
  accumulator: Accumulator;
}
