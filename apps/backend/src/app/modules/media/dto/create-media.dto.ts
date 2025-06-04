import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  alt: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  imgName?: string;
}
