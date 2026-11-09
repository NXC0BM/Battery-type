import { Module } from '@nestjs/common';
import { BatteryTypeModule } from './battery_type/battery_type.module';

@Module({
  imports: [BatteryTypeModule],
})
export class AppModule {}
