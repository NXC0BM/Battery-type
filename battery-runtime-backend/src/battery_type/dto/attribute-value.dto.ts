import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

// Пара "атрибут — значение" (вход при публикации и выход в карточке)
export class AttributeValueDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  value: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;
}
