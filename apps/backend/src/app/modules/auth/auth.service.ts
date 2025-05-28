import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../common/prisma.service';
import * as bcrypt from 'bcrypt';
import { RefreshPayload } from './auth.types';
import { DayOfWeek } from '../../common/enums/dayofweek.enums';
import { Group } from '../../common/enums/group.enums';

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
    // Remove password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...rest } = user;
    const userForResponse = {
      ...rest,
      image: rest.image ?? undefined,
      firstDayOfWeek: rest.firstDayOfWeek as DayOfWeek,
      group: rest.group as Group,
      homeDashboard: rest.homeDashboard ?? undefined,
    };
    // Generate JWT (durée configurable via .env)
    const payload = { sub: user.id, email: user.email, group: user.group };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
      secret: process.env.JWT_SECRET,
    });
    // Generate refresh token (durée configurable via .env)
    const refresh_token = this.jwtService.sign(
      { sub: user.id, email: user.email, group: user.group },
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
    });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (typeof user.refreshToken !== 'string') {
      throw new UnauthorizedException('Stored refresh token is not a string');
    }
    // Compare hashed refresh token
    const isValid = await bcrypt.compare(
      refresh_token,
      user.refreshToken as string,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Generate new access token
    return {
      access_token: this.jwtService.sign(
        { sub: payload.sub, email: payload.email, group: payload.group },
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
