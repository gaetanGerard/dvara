import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDashboardDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  public?: boolean;
}
