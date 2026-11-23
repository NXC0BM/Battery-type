import { ApiProperty } from "@nestjs/swagger";
import { BatteryTypeResponseDto } from "./battery-type-response.dto";
export class BatteryTypePageDto {
  @ApiProperty({ type: [BatteryTypeResponseDto] })
  items: BatteryTypeResponseDto[];
  @ApiProperty() total: number;
  @ApiProperty() page: number;
  @ApiProperty() limit: number;
}
