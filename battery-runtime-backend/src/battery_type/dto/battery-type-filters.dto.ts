import { IsOptional, IsNumberString } from 'class-validator';

export class BatteryTypeFiltersDto {
  @IsOptional()
  @IsNumberString()
  minCapacityMah?: string;
}
