import { IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LikeBatteryTypeDto {
  @ApiProperty({ enum: [0, 1], example: 1 })
  @Type(() => Number)
  @IsIn([0, 1])
  like: number; // 0 — отменить, 1 — поставить
}
