/**
 * Payload stored in JWT access tokens.
 */
export interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

/**
 * User object extracted from JWT for request context.
 */
export interface JwtUser {
  sub: number;
  email: string;
  role: string;
}

/**
 * Payload stored in JWT refresh tokens.
 * Optionally includes iat/exp for validation.
 */
export interface RefreshPayload {
  sub: number;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}
