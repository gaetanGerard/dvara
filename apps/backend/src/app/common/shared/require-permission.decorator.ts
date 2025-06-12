import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to require a specific permission for a resource on a route.
 * Usage: @RequirePermission({ resource: 'dashboard', action: 'canAdd' })
 */
export const RequirePermission = (opts: { resource: string; action: string }) =>
  SetMetadata('permission', opts);
