import { IsOptional, IsNumberString } from 'class-validator';

export class AccumulatorFiltersDto {
  @IsOptional()
  @IsNumberString()
  minCapacityMah?: string;
}
