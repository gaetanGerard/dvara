import { IsOptional, IsObject } from 'class-validator';

export class UpdateDashboardApplicationDto {
  @IsOptional()
  size?: string;

  @IsOptional()
  @IsObject()
  position?: Record<string, any>;

  @IsOptional()
  @IsObject()
  layoutData?: Record<string, any>;
}
