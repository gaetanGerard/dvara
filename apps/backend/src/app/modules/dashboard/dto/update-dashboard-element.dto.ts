import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateDashboardElementDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  data?: any;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsObject()
  position?: Record<string, any>;

  @IsOptional()
  @IsObject()
  layoutData?: Record<string, any>;
}
