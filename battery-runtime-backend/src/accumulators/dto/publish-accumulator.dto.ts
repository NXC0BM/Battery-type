import { IsString, IsNumber, Min, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

export class PublishAccumulatorDto {
  @IsString()
  @MinLength(1)
  shortDescription: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  capacityMah: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  nominalVoltageV: number;
}
