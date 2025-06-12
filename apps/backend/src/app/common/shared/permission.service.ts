/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getSuperAdminGroup } from './group-helpers';

/**
 * Service to resolve and check user permissions for resources/actions.
 * Handles group, owner, and system group logic.
 */
@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns true if the user has the given permission for the resource.
   * - Checks all groups (except EVERYONE if user is in a custom group with more access)
   * - Owner logic must be handled at the service level if needed
   */
  async userHasPermission(
    user: any,
    resource: string,
    action: string,
  ): Promise<boolean> {
    if (!user?.groupIds?.length) return false;
    // Get all group permissions for the user
    const groups = await this.prisma.group.findMany({
      where: { id: { in: user.groupIds } },
      include: {
        permissions: {
          include: {
            appsPerm: true,
            dashPerm: true,
            mediaPerm: true,
          },
        },
      },
    });
    // If user is in a custom group (not EVERYONE), ignore EVERYONE for positive permissions
    const hasCustom = groups.some((g) => !g.system && g.name !== 'EVERYONE');
    const relevantGroups = hasCustom
      ? groups.filter((g) => g.name !== 'EVERYONE')
      : groups;
    // Check permissions for the resource/action
    for (const group of relevantGroups) {
      for (const perm of group.permissions) {
        let permObj: any = null;
        if (resource === 'dashboard') permObj = perm.dashPerm;
        else if (resource === 'application') permObj = perm.appsPerm;
        else if (resource === 'media') permObj = perm.mediaPerm;
        if (permObj && permObj[action] === true) return true;
      }
    }
    return false;
  }
}
