import { Module } from '@nestjs/common';
import { BatteryTypeController } from './battery_type.controller';
import { BatteryTypeService } from './battery_type.service';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [MinioModule],
  controllers: [BatteryTypeController],
  providers: [BatteryTypeService],
})
export class BatteryTypeModule {}
