import { AttributeValueDto } from './attribute-value.dto';

export class BatteryTypeResponseDto {
  id: number;
  modelName: string;
  shortDescription: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  capacityMah: number | null;
  nominalVoltageV: number | null;
  likesCount: number;
  isMine: number; // 0/1
  attributes?: AttributeValueDto[]; // доп. характеристики (EAV), заполняются на странице "подробнее"
}
