import { IsNumber, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class RotationBatteryTypeDto {
  @ApiProperty() @IsNumber() @Min(0) @Max(2 * Math.PI) rotationX: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(2 * Math.PI) rotationY: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(2 * Math.PI) previousX: number;
  @ApiProperty() @IsNumber() @Min(0) @Max(2 * Math.PI) previousY: number;
}
