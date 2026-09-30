import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccumulatorsController } from './accumulators.controller';
import { AccumulatorsService } from './accumulators.service';
import { Accumulator } from './entities/accumulator.entity';
import { Like } from '../likes/like.entity';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [TypeOrmModule.forFeature([Accumulator, Like]), MinioModule],
  controllers: [AccumulatorsController],
  providers: [AccumulatorsService],
})
export class AccumulatorsModule {}
