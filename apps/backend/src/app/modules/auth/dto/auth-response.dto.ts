// DTOs for auth responses
import { User } from '../../users/entities/user.entity';

/**
 * Response DTO for login and refresh endpoints
 */
export class AuthResponseDto {
  access_token: string;
  refresh_token?: string;
  user?: User;
}

/**
 * Response DTO for logout endpoint
 */
export class LogoutResponseDto {
  message: string;
}
