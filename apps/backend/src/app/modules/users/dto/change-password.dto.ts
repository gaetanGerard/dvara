import { IsString, MinLength } from 'class-validator';
/**
 * DTO for changing a user's password (validates old and new password fields)
 */
export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8, {
    message: 'The new password must be at least 8 characters long.',
  })
  newPassword: string;
}
