import { ApiProperty } from "@nestjs/swagger";
import { AttributeValueDto } from "./attribute-value.dto";

export class BatteryTypeResponseDto {
  @ApiProperty({ type: String, nullable: true }) modelUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) shortDescriptionEn:
    string | null;
  @ApiProperty({ type: Number }) rotationX: number;
  @ApiProperty({ type: Number }) rotationY: number;
  @ApiProperty({ type: Number }) id: number;
  @ApiProperty({ type: String }) modelName: string;
  @ApiProperty({ type: String, nullable: true }) shortDescription:
    string | null;
  @ApiProperty({ type: String, nullable: true }) imageUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) videoUrl: string | null;
  @ApiProperty({ type: Number, nullable: true }) capacityMah: number | null;
  @ApiProperty({ type: Number, nullable: true }) nominalVoltageV: number | null;
  @ApiProperty({ type: Number }) likesCount: number;
  @ApiProperty({ type: Number }) isMine: number; // 0/1
  @ApiProperty({ type: Number }) isLiked: number; // 0/1: лайк текущего пользователя
  @ApiProperty({ type: [Object] }) attributes?: AttributeValueDto[]; // доп. характеристики (EAV), заполняются на странице "подробнее"
}
