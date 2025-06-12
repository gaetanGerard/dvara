/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from './permission.service';
import { PrismaService } from '../prisma.service';
import { getSuperAdminGroup } from './group-helpers';

/**
 * Guard to enforce resource/action permissions on routes using @RequirePermission.
 * - Bypass for SUPER_ADMIN group.
 * - Otherwise, checks user permissions for the resource/action.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const opts = this.reflector.get<{ resource: string; action: string }>(
      'permission',
      context.getHandler(),
    );
    if (!opts) return true; // No permission required
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException('User not authenticated');
    // Get SUPER_ADMIN group id
    const superAdminGroup = await getSuperAdminGroup(this.prisma);
    if (superAdminGroup && user.groupIds?.includes(superAdminGroup.id)) {
      return true;
    }
    // Exception : un utilisateur peut voir/modifier/supprimer son propre profil
    if (
      opts.resource === 'users' &&
      ['canView', 'canEdit', 'canDelete'].includes(opts.action) &&
      request.params?.id &&
      user.sub === Number(request.params.id)
    ) {
      return true;
    }
    // Check permission via PermissionService
    const hasPermission = await this.permissionService.userHasPermission(
      user,
      opts.resource,
      opts.action,
    );
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
