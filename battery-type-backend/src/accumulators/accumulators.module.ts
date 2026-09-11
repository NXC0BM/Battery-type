import { Module } from '@nestjs/common';
import { AccumulatorsController } from './accumulators.controller';
import { AccumulatorsService } from './accumulators.service';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [MinioModule],
  controllers: [AccumulatorsController],
  providers: [AccumulatorsService],
})
export class AccumulatorsModule {}
