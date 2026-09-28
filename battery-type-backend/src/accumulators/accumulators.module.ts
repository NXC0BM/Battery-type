import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccumulatorsController } from './accumulators.controller';
import { AccumulatorsService } from './accumulators.service';
import { Accumulator } from './entities/accumulator.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Accumulator])],
  controllers: [AccumulatorsController],
  providers: [AccumulatorsService],
})
export class AccumulatorsModule {}
