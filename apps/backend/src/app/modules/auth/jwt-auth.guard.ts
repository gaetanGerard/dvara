import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// JWT Auth Guard for protecting routes with JWT access token
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
