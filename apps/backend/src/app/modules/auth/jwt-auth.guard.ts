import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard protects routes by requiring a valid JWT token.
 * - Extends the default AuthGuard('jwt') from @nestjs/passport.
 * - Ensures that only authenticated users can access protected endpoints.
 * - Used as a @UseGuards(JwtAuthGuard) decorator on controllers or routes.
 *
 * Usage example:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('profile')
 *   getProfile(@Request() req) { ... }
 */
// JWT Auth Guard for protecting routes with JWT access token
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
