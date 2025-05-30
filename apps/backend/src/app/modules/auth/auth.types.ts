/**
 * Payload stored in JWT access tokens.
 */
export interface JwtPayload {
  sub: number;
  email: string;
  groupIds: number[];
  adminGroupIds: number[];
}

/**
 * User object extracted from JWT for request context.
 */
export interface JwtUser {
  sub: number;
  email: string;
  groupIds: number[];
  adminGroupIds: number[];
}

/**
 * Payload stored in JWT refresh tokens.
 * Optionally includes iat/exp for validation.
 */
export interface RefreshPayload {
  sub: number;
  email?: string;
  groupIds?: number[];
  adminGroupIds?: number[];
  iat?: number;
  exp?: number;
}
