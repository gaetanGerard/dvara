/**
 * Data Transfer Object for creating a user.
 * Validates required fields and enforces password policy.
 */
import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Role } from '../../../common/enums/role.enums';
import { DayOfWeek } from '../../../common/enums/dayofweek.enums';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, {
    message: 'Le mot de passe doit contenir au moins 8 caractères.',
  })
  password: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(DayOfWeek)
  firstDayOfWeek?: DayOfWeek;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  homeDashboard?: number;
}
