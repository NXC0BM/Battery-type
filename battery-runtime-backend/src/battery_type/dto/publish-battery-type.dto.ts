import {
  IsString,
  IsNumber,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
  Matches,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AttributeValueDto } from "./attribute-value.dto";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class PublishBatteryTypeDto {
  @ApiProperty({ example: "Li-ion аккумулятор для электроинструмента" })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  shortDescription: string;

  @ApiProperty({ example: 3000 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacityMah: number;

  @ApiProperty({ example: 3.6 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(99.99)
  nominalVoltageV: number;

  @ApiPropertyOptional({
    example:
      "Green cylindrical lithium ion battery cell for portable power tools.",
  })
  @IsOptional()
  @IsString()
  @MinLength(50)
  @MaxLength(100)
  @Matches(/^[\x20-\x7E]+$/)
  shortDescriptionEn?: string;

  // Необязательный набор доп. характеристик (EAV)
  @ApiPropertyOptional({ type: [AttributeValueDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeValueDto)
  attributes?: AttributeValueDto[];
}
