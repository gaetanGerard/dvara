import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../common/prisma.service';
import * as bcrypt from 'bcrypt';
import { RefreshPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Authenticates a user with email and password. Returns a JWT and refresh token if valid.
   */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...rest } = user;
    const userFull = await this.usersService.findOne(user.id);
    const groupIds = Array.isArray(userFull.groups)
      ? userFull.groups.map((g: { id: number }) => g.id)
      : [];
    const adminGroupIds = Array.isArray(userFull.adminGroups)
      ? userFull.adminGroups.map((g: { id: number }) => g.id)
      : [];
    const userForResponse = {
      ...userFull,
      image: userFull.image ?? undefined,
      homeDashboard: userFull.homeDashboard ?? undefined,
      languageId: userFull.languageId ?? undefined,
      dayOfWeekId: userFull.dayOfWeekId ?? undefined,
    };
    const payload = {
      sub: user.id,
      email: user.email,
      groupIds,
      adminGroupIds,
    };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      secret: process.env.JWT_SECRET,
    });
    // Generate refresh token (durée configurable via .env)
    const refresh_token = this.jwtService.sign(
      { sub: user.id, email: user.email, groupIds, adminGroupIds },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
        secret: process.env.JWT_SECRET,
      },
    );
    // Hash refresh token before storing
    const hashedRefreshToken = await bcrypt.hash(refresh_token, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });
    return { access_token, refresh_token, user: userForResponse };
  }

  /**
   * Refreshes the access token using a valid refresh token.
   */
  async refreshToken(refresh_token: string) {
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(refresh_token, {
        secret: process.env.JWT_SECRET || 'dev_secret_key',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    // Check refresh token in DB
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        groups: true,
        adminGroups: true,
      },
    });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (typeof user.refreshToken !== 'string') {
      throw new UnauthorizedException('Stored refresh token is not a string');
    }
    // Compare hashed refresh token
    const isValid = await bcrypt.compare(refresh_token, user.refreshToken);
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const groupIds = Array.isArray(user.groups)
      ? user.groups.map((g: { id: number }) => g.id)
      : [];
    const adminGroupIds = Array.isArray(user.adminGroups)
      ? user.adminGroups.map((g: { id: number }) => g.id)
      : [];
    // Generate new access token
    return {
      access_token: this.jwtService.sign(
        { sub: user.id, email: user.email, groupIds, adminGroupIds },
        {
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
          secret: process.env.JWT_SECRET,
        },
      ),
    };
  }

  /**
   * Revokes the refresh token on logout.
   */
  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Successfully logged out.' };
  }
}
