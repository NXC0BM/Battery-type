import { Module } from '@nestjs/common';
import { AccumulatorsModule } from './accumulators/accumulators.module';

@Module({
  imports: [AccumulatorsModule],
})
export class AppModule {}
