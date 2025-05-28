import { IsString, MinLength } from 'class-validator';
/**
 * Data Transfer Object for changing a user's password.
 * Validates old and new password fields.
 */
export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(8, {
    message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.',
  })
  newPassword: string;
}
