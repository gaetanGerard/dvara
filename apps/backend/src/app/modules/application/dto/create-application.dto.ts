import { IsString, IsInt, IsOptional, IsBoolean } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  name: string;

  @IsInt()
  iconMediaId: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsBoolean()
  displayPingUrl?: boolean;

  @IsOptional()
  @IsString()
  pingUrl?: string;
}
