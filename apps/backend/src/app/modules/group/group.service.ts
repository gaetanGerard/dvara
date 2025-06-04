/**
 * GroupService manages all group-related business logic and data access.
 * - Handles group creation, update, deletion, permissions, and settings.
 * - Manages group membership, admin roles, and group permissions.
 * - Integrates with Prisma for all group-related database operations.
 *
 * Main methods:
 *   - create: Create a new group with permissions and settings
 *   - findAll: List all groups accessible to the user
 *   - findOne: Get details of a group by id, with access control
 *   - update: Update group members, admins, permissions, and settings
 *   - remove: Delete a group and all related links/settings
 *
 * All errors are handled with explicit exceptions for robust API behavior.
 *
 * Usage example:
 *   const group = await groupService.create(createGroupDto, user);
 *   const groups = await groupService.findAll(user);
 *   const updated = await groupService.update(id, updateGroupDto, user);
 */
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { Group as SystemGroup } from '../../common/enums/group.enums';
import {
  getSuperAdminGroup,
  getSuperAdminIds,
  assertAtLeastOneSuperAdminAdmin,
  isSuperAdmin,
  isGroupAdmin,
  dedupeIds,
  areIdArraysEqual,
  createGroupPermissions,
  groupIncludeFull,
  groupIncludeAdminsPermsSettings,
} from '../../common/shared/group-helpers';

// Service for managing groups, permissions, and settings
@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new group with permissions and settings
  async create(createGroupDto: CreateGroupDto, user: any) {
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: SystemGroup.SUPER_ADMIN },
    });
    if (!superAdminGroup)
      throw new BadRequestException('SUPER_ADMIN group not found');
    if (!user.groupIds?.includes(superAdminGroup.id)) {
      throw new ForbiddenException(
        'You do not have permission to create a group.',
      );
    }
    if ((createGroupDto as any).system !== undefined) {
      throw new ForbiddenException(
        'System groups cannot be created via the API.',
      );
    }
    let usersToConnect: { id: number }[] = [];
    if (createGroupDto.userIds && createGroupDto.userIds.length > 0) {
      const foundUsers = await this.prisma.user.findMany({
        where: { id: { in: createGroupDto.userIds } },
        select: { id: true },
      });
      if (foundUsers.length !== createGroupDto.userIds.length) {
        throw new BadRequestException('One or more users to add do not exist.');
      }
      usersToConnect = foundUsers.map((u) => ({ id: u.id }));
    }
    const superAdmins = await this.prisma.user.findMany({
      where: { groups: { some: { id: superAdminGroup.id } } },
      select: { id: true },
    });
    const superAdminIds = superAdmins.map((u) => u.id);
    const adminsToConnect: { id: number }[] = superAdminIds.map((id) => ({
      id,
    }));
    if (createGroupDto.adminIds && createGroupDto.adminIds.length > 0) {
      const foundAdmins = await this.prisma.user.findMany({
        where: { id: { in: createGroupDto.adminIds } },
        select: { id: true },
      });
      if (foundAdmins.length !== createGroupDto.adminIds.length) {
        throw new BadRequestException(
          'One or more admins to add do not exist.',
        );
      }
      for (const admin of foundAdmins) {
        if (!superAdminIds.includes(admin.id)) {
          adminsToConnect.push({ id: admin.id });
        }
      }
    }
    const existingGroup = await this.prisma.group.findUnique({
      where: { name: createGroupDto.name },
    });
    if (existingGroup) {
      throw new BadRequestException('A group with this name already exists.');
    }
    let groupPermissionIds: number[] | undefined = undefined;
    groupPermissionIds = await createGroupPermissions(
      this.prisma,
      createGroupDto.name,
      createGroupDto.permissions,
    );
    const group = await this.prisma.group.create({
      data: {
        name: createGroupDto.name,
        system: false,
        users:
          usersToConnect.length > 0 ? { connect: usersToConnect } : undefined,
        admins:
          adminsToConnect.length > 0 ? { connect: adminsToConnect } : undefined,
        permissions: groupPermissionIds
          ? { connect: groupPermissionIds.map((id) => ({ id })) }
          : undefined,
        settings: createGroupDto.settings
          ? { create: createGroupDto.settings }
          : undefined,
      },
      include: groupIncludeFull,
    });
    return group;
  }

  // List all groups accessible to the user
  async findAll(user: any) {
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: SystemGroup.SUPER_ADMIN },
    });
    const isSuperAdmin = user.groupIds?.includes(superAdminGroup?.id);
    if (isSuperAdmin) {
      return this.prisma.group.findMany({
        include: groupIncludeFull,
      });
    }
    const groupIds = [
      ...(user.groupIds || []),
      ...(user.adminGroupIds || []),
    ].filter((id) => typeof id === 'number');
    if (groupIds.length > 0) {
      const everyoneGroup = await this.prisma.group.findUnique({
        where: { name: SystemGroup.EVERYONE },
      });
      const excludeIds = [everyoneGroup?.id].filter(
        (id) => typeof id === 'number',
      );
      const groups = await this.prisma.group.findMany({
        where: {
          id: { in: groupIds, notIn: excludeIds },
          system: false,
        },
        include: groupIncludeFull,
      });
      return groups.map((g) => {
        const isAdmin = user.adminGroupIds?.includes(g.id);
        if (isAdmin) {
          return g;
        } else {
          return {
            id: g.id,
            name: g.name,
            permissions: g.permissions,
            settings: g.settings,
            admins: g.admins,
          };
        }
      });
    }
    return [];
  }

  // Get details of a group by id, with access control
  async findOne(id: number, user: any) {
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: SystemGroup.SUPER_ADMIN },
    });
    const isSuperAdmin = user.groupIds?.includes(superAdminGroup?.id);
    if (isSuperAdmin) {
      return this.prisma.group.findUnique({
        where: { id },
        include: groupIncludeFull,
      });
    }
    if (user.adminGroupIds && user.adminGroupIds.includes(id)) {
      return this.prisma.group.findUnique({
        where: { id },
        include: groupIncludeFull,
      });
    }
    if (user.groupIds && user.groupIds.includes(id)) {
      const group = await this.prisma.group.findUnique({
        where: { id },
        include: groupIncludeAdminsPermsSettings,
      });
      if (!group) return null;
      return {
        id: group.id,
        name: group.name,
        permissions: group.permissions,
        settings: group.settings,
        admins: group.admins,
      };
    }
    throw new ForbiddenException('You do not have access to this group.');
  }

  // Update a group (admins, members, permissions, settings)
  async update(
    id: number,
    updateGroupDto: {
      userIds?: number[];
      adminIds?: number[];
      permissions?: any;
      settings?: any;
    },
    user: any,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        admins: true,
        users: true,
        permissions: true,
      },
    });
    if (!group) throw new BadRequestException('Group not found');
    if (group.system) {
      if (
        'name' in updateGroupDto &&
        updateGroupDto.name &&
        updateGroupDto.name !== group.name
      ) {
        throw new ForbiddenException('Cannot rename a system group.');
      }
      if ('system' in updateGroupDto) {
        throw new ForbiddenException(
          'Cannot change the system status of a system group.',
        );
      }
    } else {
      if ('system' in updateGroupDto) {
        throw new ForbiddenException(
          'Cannot change the system status of a group.',
        );
      }
    }
    const superAdminGroup = await getSuperAdminGroup(this.prisma, true);
    if (!superAdminGroup)
      throw new BadRequestException('SUPER_ADMIN group not found');
    const superAdminIds = getSuperAdminIds(superAdminGroup);
    const typedUser = user as {
      groupIds?: number[];
      adminGroupIds?: number[];
      sub?: number;
    };
    const isSuper = isSuperAdmin(typedUser, superAdminGroup.id);
    const isAdmin = isGroupAdmin(typedUser, id);
    if (!isSuper && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to update this group.',
      );
    }
    let newAdminIds = group.admins.map((a) => a.id);
    if (isSuper && updateGroupDto.adminIds) {
      newAdminIds = dedupeIds([...superAdminIds, ...updateGroupDto.adminIds]);
    }
    assertAtLeastOneSuperAdminAdmin(newAdminIds, superAdminIds);
    if (!isSuper && isAdmin && updateGroupDto.adminIds) {
      const currentAdminIds = group.admins.map((a) => a.id);
      const requestedAdminIds = dedupeIds(updateGroupDto.adminIds);
      if (!areIdArraysEqual(currentAdminIds, requestedAdminIds)) {
        throw new ForbiddenException(
          'Only a super_admin can modify the list of group admins.',
        );
      }
    }
    const newUserIds = updateGroupDto.userIds
      ? dedupeIds(updateGroupDto.userIds)
      : group.users.map((u) => u.id);
    if (updateGroupDto.permissions) {
      if (!isSuper && !isAdmin) {
        throw new ForbiddenException(
          'You cannot update the permissions of this group.',
        );
      }
      const groupPerm = group.permissions[0];
      if (groupPerm) {
        if (
          updateGroupDto.permissions.appsPerm &&
          groupPerm.appsPermId != null
        ) {
          await this.prisma.appsPerm.update({
            where: { id: groupPerm.appsPermId },
            data: {
              canAdd: updateGroupDto.permissions.appsPerm.canAdd ?? false,
              canEdit: updateGroupDto.permissions.appsPerm.canEdit ?? false,
              canView: updateGroupDto.permissions.appsPerm.canView ?? false,
              canUse: updateGroupDto.permissions.appsPerm.canUse ?? false,
              canDelete: updateGroupDto.permissions.appsPerm.canDelete ?? false,
            },
          });
        }
        if (
          updateGroupDto.permissions.dashPerm &&
          groupPerm.dashPermId != null
        ) {
          await this.prisma.dashPerm.update({
            where: { id: groupPerm.dashPermId },
            data: {
              canAdd: updateGroupDto.permissions.dashPerm.canAdd ?? false,
              canEdit: updateGroupDto.permissions.dashPerm.canEdit ?? false,
              canView: updateGroupDto.permissions.dashPerm.canView ?? false,
              canUse: updateGroupDto.permissions.dashPerm.canUse ?? false,
              canDelete: updateGroupDto.permissions.dashPerm.canDelete ?? false,
            },
          });
        }
        if (
          updateGroupDto.permissions.mediaPerm &&
          groupPerm.mediaPermId != null
        ) {
          await this.prisma.mediaPerm.update({
            where: { id: groupPerm.mediaPermId },
            data: {
              canUpload:
                updateGroupDto.permissions.mediaPerm.canUpload ?? false,
              canDelete:
                updateGroupDto.permissions.mediaPerm.canDelete ?? false,
              canEdit: updateGroupDto.permissions.mediaPerm.canEdit ?? false,
              canView: updateGroupDto.permissions.mediaPerm.canView ?? false,
              canUse: updateGroupDto.permissions.mediaPerm.canUse ?? false,
            },
          });
        }
      }
    }
    if (updateGroupDto.settings) {
      const groupSetting = await this.prisma.groupSetting.findUnique({
        where: { groupId: group.id },
      });
      if (groupSetting) {
        await this.prisma.groupSetting.update({
          where: { id: groupSetting.id },
          data: updateGroupDto.settings,
        });
      } else {
        await this.prisma.groupSetting.create({
          data: {
            ...updateGroupDto.settings,
            groupId: group.id,
          },
        });
      }
    }
    const updateData: any = {
      admins: { set: newAdminIds.map((id) => ({ id })) },
      users: { set: newUserIds.map((id) => ({ id })) },
    };
    if (
      !group.system &&
      'name' in updateGroupDto &&
      updateGroupDto.name &&
      updateGroupDto.name !== group.name
    ) {
      updateData.name = updateGroupDto.name;
    }
    const updatedGroup = await this.prisma.group.update({
      where: { id },
      data: updateData,
      include: groupIncludeFull,
    });
    return updatedGroup;
  }

  // Delete a group with all related links and settings
  async remove(id: number, user: any) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { admins: true, users: true, permissions: true },
    });
    if (!group) throw new BadRequestException('Group not found');
    if (group.system) {
      throw new ForbiddenException('Cannot delete a system group.');
    }
    const superAdminGroup = await getSuperAdminGroup(this.prisma);
    if (!superAdminGroup)
      throw new BadRequestException('SUPER_ADMIN group not found');
    const typedUser = user as {
      groupIds?: number[];
      adminGroupIds?: number[];
      sub?: number;
    };
    if (
      !isSuperAdmin(typedUser, superAdminGroup.id) &&
      !isGroupAdmin(typedUser, id)
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this group.',
      );
    }
    await this.prisma.$transaction([
      this.prisma.group.update({
        where: { id },
        data: {
          users: { set: [] },
          admins: { set: [] },
          permissions: { set: [] },
        },
      }),
      this.prisma.groupSetting.deleteMany({ where: { groupId: id } }),
      this.prisma.group.delete({ where: { id } }),
    ]);
    return { success: true };
  }
}
