import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryTypeController } from './battery_type.controller';
import { BatteryTypeService } from './battery_type.service';
import { BatteryType } from './entities/battery-type.entity';
import { Like } from '../likes/like.entity';
import { MinioModule } from '../minio/minio.module';

@Module({
  imports: [TypeOrmModule.forFeature([BatteryType, Like]), MinioModule],
  controllers: [BatteryTypeController],
  providers: [BatteryTypeService],
})
export class BatteryTypeModule {}
