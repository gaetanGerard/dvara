import {
  IsString,
  IsOptional,
  IsArray,
  ArrayUnique,
  IsInt,
  IsObject,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  userIds?: number[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  adminIds?: number[];

  @IsOptional()
  @IsObject()
  permissions?: {
    appsPerm?: {
      canAdd?: boolean;
      canEdit?: boolean;
      canView?: boolean;
      canUse?: boolean;
      canDelete?: boolean;
    };
    dashPerm?: {
      canAdd?: boolean;
      canEdit?: boolean;
      canView?: boolean;
      canUse?: boolean;
      canDelete?: boolean;
    };
    mediaPerm?: {
      canUpload?: boolean;
      canDelete?: boolean;
      canEdit?: boolean;
      canView?: boolean;
      canUse?: boolean;
    };
  };

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
