/**
 * AuthController exposes all authentication-related API endpoints.
 * - Handles user login, token refresh, and logout operations.
 * - Secures endpoints and delegates authentication logic to AuthService.
 *
 * Main endpoints:
 *   - POST /auth/login: Authenticate user and issue tokens
 *   - POST /auth/refresh: Refresh JWT token using a valid refresh token
 *   - POST /auth/logout: Invalidate the user's refresh token
 *
 * All errors are handled with explicit exceptions for robust API behavior.
 *
 * Usage example:
 *   const tokens = await authController.login(loginDto);
 *   const refreshed = await authController.refresh(refreshDto);
 */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Request } from 'express';
import { JwtUser } from './auth.types';
import { UnauthorizedException } from '@nestjs/common';
import { AuthResponseDto, LogoutResponseDto } from './dto/auth-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Authenticates a user and returns a JWT and user data if credentials are valid.
   */
  @Post('login')
  async login(@Body() createAuthDto: CreateAuthDto): Promise<AuthResponseDto> {
    const result = await this.authService.validateUser(
      createAuthDto.email,
      createAuthDto.password,
    );
    if (result.user) {
      const user = result.user as any;
      if (user.languageId === null) user.languageId = undefined;
      if (user.dayOfWeekId === null) user.dayOfWeekId = undefined;
      if (user.language === null) user.language = undefined;
      if (user.dayOfWeek === null) user.dayOfWeek = undefined;
      result.user = user;
    }
    return result as unknown as AuthResponseDto;
  }

  /**
   * Refreshes the access token using a valid refresh token.
   */
  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.refreshToken(
      refreshTokenDto.refresh_token,
    );
    if ('user' in result && result.user) {
      const user = result.user as any;
      if (user.languageId === null) user.languageId = undefined;
      if (user.dayOfWeekId === null) user.dayOfWeekId = undefined;
      if (user.language === null) user.language = undefined;
      if (user.dayOfWeek === null) user.dayOfWeek = undefined;
      result.user = user;
    }
    return result as unknown as AuthResponseDto;
  }

  /**
   * Logs out a user (revokes refresh token, requires valid access token).
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Req() req: Request & { user?: JwtUser },
  ): Promise<LogoutResponseDto> {
    if (!req.user) throw new UnauthorizedException('User not found in request');
    return this.authService.logout(req.user.sub);
  }

  /**
   * Resets a user's password and forcibly logs out the user by revoking their refresh token.
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reset-password')
  async resetPassword(
    @Req() req: Request & { user?: JwtUser },
    @Param('id') id: string,
  ) {
    const user = req.user;
    const userId = parseInt(id, 10);
    const result = await this.authService['usersService'].resetPassword(userId);
    if (user?.sub === userId) {
      await this.authService.logout(userId);
    }
    return result;
  }
}
