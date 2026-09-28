import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';
import { AccumulatorStatus } from './accumulator-status.enum';
import { Like } from '../../likes/like.entity';

@Entity('accumulators')
export class Accumulator {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'model_name', type: 'varchar', length: 100 })
  modelName: string;

  @Column({ name: 'short_description', type: 'varchar', length: 255, nullable: true })
  shortDescription: string;

  @Column({ type: 'varchar', length: 20, default: AccumulatorStatus.DRAFT })
  status: AccumulatorStatus;

  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @Column({ name: 'video_url', type: 'varchar', length: 255, nullable: true })
  videoUrl: string;

  @Column({ name: 'capacity_mah', type: 'integer', nullable: true })
  capacityMah: number;

  @Column({ name: 'nominal_voltage_v', type: 'numeric', precision: 4, scale: 2, nullable: true })
  nominalVoltageV: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => Like, (like) => like.accumulator)
  likes: Like[];
}
