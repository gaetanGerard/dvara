import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
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
    return this.authService.validateUser(
      createAuthDto.email,
      createAuthDto.password,
    );
  }

  /**
   * Refreshes the access token using a valid refresh token.
   */
  @Post('refresh')
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
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
}
