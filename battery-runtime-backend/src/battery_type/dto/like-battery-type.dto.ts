import { IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class LikeBatteryTypeDto {
  @Type(() => Number)
  @IsIn([0, 1])
  like: number; // 0 — отменить, 1 — поставить
}
