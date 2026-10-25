import { IsString, IsNumber, Min, MinLength, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AttributeValueDto } from './attribute-value.dto';

export class PublishBatteryTypeDto {
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

  // Необязательный набор доп. характеристик (EAV)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  attributes?: AttributeValueDto[];
}
