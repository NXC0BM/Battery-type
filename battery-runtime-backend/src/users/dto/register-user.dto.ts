import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(4)
  password: string;
}
