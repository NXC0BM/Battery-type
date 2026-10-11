import { IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @MinLength(2)
  username: string;
}
