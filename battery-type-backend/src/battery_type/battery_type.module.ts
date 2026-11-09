import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BatteryTypeController } from './battery_type.controller';
import { BatteryTypeService } from './battery_type.service';
import { BatteryType } from './entities/battery_type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BatteryType])],
  controllers: [BatteryTypeController],
  providers: [BatteryTypeService],
})
export class BatteryTypeModule {}
