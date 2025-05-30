/**
 * DTO for creating a user
 */
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsInt,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { Language } from '../../../common/enums/language.enums';
import { DayOfWeek } from '../../../common/enums/dayofweek.enums';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(2)
  pseudo: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'The password must be at least 8 characters long.',
  })
  password: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsInt()
  languageId?: number;

  @IsOptional()
  @IsInt()
  dayOfWeekId?: number;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  groupIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  adminGroupIds?: number[];

  @IsOptional()
  homeDashboard?: number;

  @IsOptional()
  language?: Language;

  @IsOptional()
  dayOfWeek?: DayOfWeek;
}
