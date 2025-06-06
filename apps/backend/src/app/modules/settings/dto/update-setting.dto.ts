import { IsString, IsOptional } from 'class-validator';
import { ThemeType } from '@prisma/client';

export class UpdateSettingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  main_color?: string;

  @IsOptional()
  @IsString()
  secondary_color?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  theme?: ThemeType;
}
