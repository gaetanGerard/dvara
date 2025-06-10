import { IsOptional, IsObject } from 'class-validator';

export class UpdateDashboardCategoryDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  order?: number;

  @IsOptional()
  size?: string;

  @IsOptional()
  @IsObject()
  position?: Record<string, any>;

  @IsOptional()
  @IsObject()
  layoutData?: Record<string, any>;
}
