import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { Group as SystemGroup } from '../../common/enums/group.enums';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGroupDto: CreateGroupDto, user: any) {
    // Vérifier que l'utilisateur est super_admin
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: SystemGroup.SUPER_ADMIN },
    });
    if (!superAdminGroup)
      throw new BadRequestException('Groupe SUPER_ADMIN introuvable');
    if (!user.groupIds?.includes(superAdminGroup.id)) {
      throw new ForbiddenException(
        "Vous n'avez pas le droit de créer un groupe.",
      );
    }

    // Empêcher la création d'un groupe système
    if ((createGroupDto as any).system !== undefined) {
      throw new ForbiddenException(
        "Impossible de créer un groupe système via l'API",
      );
    }

    // Vérifier l'existence des utilisateurs à ajouter
    let usersToConnect: { id: number }[] = [];
    if (createGroupDto.userIds && createGroupDto.userIds.length > 0) {
      const foundUsers = await this.prisma.user.findMany({
        where: { id: { in: createGroupDto.userIds } },
        select: { id: true },
      });
      if (foundUsers.length !== createGroupDto.userIds.length) {
        throw new BadRequestException(
          "Un ou plusieurs utilisateurs à ajouter n'existent pas",
        );
      }
      usersToConnect = foundUsers.map((u) => ({ id: u.id }));
    }

    // Les super_admins sont toujours admins du groupe
    const superAdmins = await this.prisma.user.findMany({
      where: { groups: { some: { id: superAdminGroup.id } } },
      select: { id: true },
    });
    const superAdminIds = superAdmins.map((u) => u.id);

    // Vérifier l'existence des admins à ajouter (hors super_admins)
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
          "Un ou plusieurs admins à ajouter n'existent pas",
        );
      }
      // Ajoute les admins fournis s'ils ne sont pas déjà super_admin
      for (const admin of foundAdmins) {
        if (!superAdminIds.includes(admin.id)) {
          adminsToConnect.push({ id: admin.id });
        }
      }
    }

    // Vérifier unicité du nom du groupe
    const existingGroup = await this.prisma.group.findUnique({
      where: { name: createGroupDto.name },
    });
    if (existingGroup) {
      throw new BadRequestException('Un groupe avec ce nom existe déjà.');
    }

    // Création dynamique des permissions si fournies, sinon permissions par défaut (tout à false)
    let groupPermissionIds: number[] | undefined = undefined;
    if (createGroupDto.permissions) {
      // Pour chaque bloc de permissions, tous les champs non définis sont explicitement mis à false
      const appsPermData = {
        name: `${createGroupDto.name}_APPS`,
        canAdd: createGroupDto.permissions.appsPerm?.canAdd ?? false,
        canEdit: createGroupDto.permissions.appsPerm?.canEdit ?? false,
        canView: createGroupDto.permissions.appsPerm?.canView ?? false,
        canUse: createGroupDto.permissions.appsPerm?.canUse ?? false,
        canDelete: createGroupDto.permissions.appsPerm?.canDelete ?? false,
      };
      const dashPermData = {
        name: `${createGroupDto.name}_DASH`,
        canAdd: createGroupDto.permissions.dashPerm?.canAdd ?? false,
        canEdit: createGroupDto.permissions.dashPerm?.canEdit ?? false,
        canView: createGroupDto.permissions.dashPerm?.canView ?? false,
        canUse: createGroupDto.permissions.dashPerm?.canUse ?? false,
        canDelete: createGroupDto.permissions.dashPerm?.canDelete ?? false,
      };
      const mediaPermData = {
        name: `${createGroupDto.name}_MEDIA`,
        canUpload: createGroupDto.permissions.mediaPerm?.canUpload ?? false,
        canDelete: createGroupDto.permissions.mediaPerm?.canDelete ?? false,
        canEdit: createGroupDto.permissions.mediaPerm?.canEdit ?? false,
        canView: createGroupDto.permissions.mediaPerm?.canView ?? false,
        canUse: createGroupDto.permissions.mediaPerm?.canUse ?? false,
      };
      const appsPerm = await this.prisma.appsPerm.create({
        data: appsPermData,
      });
      const dashPerm = await this.prisma.dashPerm.create({
        data: dashPermData,
      });
      const mediaPerm = await this.prisma.mediaPerm.create({
        data: mediaPermData,
      });
      // Crée la GroupPermission associée
      const groupPerm = await this.prisma.groupPermission.create({
        data: {
          name: `${createGroupDto.name}_PERM`,
          description: `Permissions for group ${createGroupDto.name}`,
          appsPermId: appsPerm.id,
          dashPermId: dashPerm.id,
          mediaPermId: mediaPerm.id,
        },
      });
      groupPermissionIds = [groupPerm.id];
    } else {
      // Permissions par défaut (tout à false)
      const appsPerm = await this.prisma.appsPerm.create({
        data: {
          name: `${createGroupDto.name}_APPS`,
          canAdd: false,
          canEdit: false,
          canView: false,
          canUse: false,
          canDelete: false,
        },
      });
      const dashPerm = await this.prisma.dashPerm.create({
        data: {
          name: `${createGroupDto.name}_DASH`,
          canAdd: false,
          canEdit: false,
          canView: false,
          canUse: false,
          canDelete: false,
        },
      });
      const mediaPerm = await this.prisma.mediaPerm.create({
        data: {
          name: `${createGroupDto.name}_MEDIA`,
          canUpload: false,
          canDelete: false,
          canEdit: false,
          canView: false,
          canUse: false,
        },
      });
      const groupPerm = await this.prisma.groupPermission.create({
        data: {
          name: `${createGroupDto.name}_PERM`,
          description: `Default permissions for group ${createGroupDto.name}`,
          appsPermId: appsPerm.id,
          dashPermId: dashPerm.id,
          mediaPermId: mediaPerm.id,
        },
      });
      groupPermissionIds = [groupPerm.id];
    }

    // Création du groupe
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
      include: {
        users: { select: { id: true, name: true, pseudo: true, email: true } },
        admins: { select: { id: true, name: true, pseudo: true, email: true } },
        permissions: {
          include: {
            appsPerm: true,
            dashPerm: true,
            mediaPerm: true,
          },
        },
        settings: true,
      },
    });
    return group;
  }

  async findAll(user: any) {
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: SystemGroup.SUPER_ADMIN },
    });
    const isSuperAdmin = user.groupIds?.includes(superAdminGroup?.id);
    if (isSuperAdmin) {
      // Super admin : retourne tous les groupes
      return this.prisma.group.findMany({
        include: {
          users: {
            select: { id: true, name: true, pseudo: true, email: true },
          },
          admins: {
            select: { id: true, name: true, pseudo: true, email: true },
          },
          permissions: {
            include: { appsPerm: true, dashPerm: true, mediaPerm: true },
          },
          settings: true,
        },
      });
    }
    // Pour tout autre utilisateur : retourne uniquement les groupes dont il est membre ou admin, sans les groupes système ni EVERYONE
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
        include: {
          users: {
            select: { id: true, name: true, pseudo: true, email: true },
          },
          admins: {
            select: { id: true, name: true, pseudo: true, email: true },
          },
          permissions: {
            include: { appsPerm: true, dashPerm: true, mediaPerm: true },
          },
          settings: true,
        },
      });
      // Pour chaque groupe, filtre selon le rôle de l'utilisateur
      return groups.map((g) => {
        const isAdmin = user.adminGroupIds?.includes(g.id);
        if (isAdmin) {
          // admin du groupe : accès complet
          return g;
        } else {
          // membre lambda : accès restreint (pas de users, retourne seulement les champs autorisés)
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
    // Sinon, aucun groupe
    return [];
  }

  async findOne(id: number, user: any) {
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: SystemGroup.SUPER_ADMIN },
    });
    const isSuperAdmin = user.groupIds?.includes(superAdminGroup?.id);
    if (isSuperAdmin) {
      // Super admin : accès à tout
      return this.prisma.group.findUnique({
        where: { id },
        include: {
          users: {
            select: { id: true, name: true, pseudo: true, email: true },
          },
          admins: {
            select: { id: true, name: true, pseudo: true, email: true },
          },
          permissions: {
            include: { appsPerm: true, dashPerm: true, mediaPerm: true },
          },
          settings: true,
        },
      });
    }
    // admin du groupe : accès complet
    if (user.adminGroupIds && user.adminGroupIds.includes(id)) {
      return this.prisma.group.findUnique({
        where: { id },
        include: {
          users: {
            select: { id: true, name: true, pseudo: true, email: true },
          },
          admins: {
            select: { id: true, name: true, pseudo: true, email: true },
          },
          permissions: {
            include: { appsPerm: true, dashPerm: true, mediaPerm: true },
          },
          settings: true,
        },
      });
    }
    // membre lambda : accès restreint (pas de users)
    if (user.groupIds && user.groupIds.includes(id)) {
      const group = await this.prisma.group.findUnique({
        where: { id },
        include: {
          admins: {
            select: { id: true, name: true, pseudo: true, email: true },
          },
          permissions: {
            include: { appsPerm: true, dashPerm: true, mediaPerm: true },
          },
          settings: true,
        },
      });
      if (!group) return null;
      // Retourne seulement les champs autorisés pour un lambda
      return {
        id: group.id,
        name: group.name,
        permissions: group.permissions,
        settings: group.settings,
        admins: group.admins,
      };
    }
    // Sinon, accès refusé
    throw new ForbiddenException("Vous n'avez pas accès à ce groupe.");
  }

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
    // Récupérer le groupe et les super_admins
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        admins: true,
        users: true,
        permissions: true,
      },
    });
    if (!group) throw new BadRequestException('Groupe introuvable');

    // Empêcher la modification du nom ou du champ system pour un groupe système
    if (group.system) {
      if (
        'name' in updateGroupDto &&
        updateGroupDto.name &&
        updateGroupDto.name !== group.name
      ) {
        throw new ForbiddenException(
          "Impossible de modifier le nom d'un groupe système.",
        );
      }
      if ('system' in updateGroupDto) {
        throw new ForbiddenException(
          "Impossible de modifier le statut système d'un groupe système.",
        );
      }
    } else {
      if ('system' in updateGroupDto) {
        throw new ForbiddenException(
          "Impossible de modifier le statut système d'un groupe.",
        );
      }
    }

    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: SystemGroup.SUPER_ADMIN },
      include: { users: true },
    });
    if (!superAdminGroup)
      throw new BadRequestException('Groupe SUPER_ADMIN introuvable');
    const superAdminIds = superAdminGroup.users.map((u) => u.id);
    const isSuperAdmin = user.groupIds?.includes(superAdminGroup.id);
    const isGroupAdmin = user.adminGroupIds?.includes(id);

    // Droit d'accès : super_admin ou admin du groupe
    if (!isSuperAdmin && !isGroupAdmin) {
      throw new ForbiddenException(
        "Vous n'avez pas le droit de modifier ce groupe.",
      );
    }

    // Gestion des admins
    let newAdminIds = group.admins.map((a) => a.id);
    if (isSuperAdmin && updateGroupDto.adminIds) {
      // Seul un super_admin peut modifier la liste des admins
      newAdminIds = Array.from(
        new Set([...superAdminIds, ...updateGroupDto.adminIds]),
      );
      // Toujours forcer les super_admins comme admins
      newAdminIds = Array.from(new Set([...superAdminIds, ...newAdminIds]));
    }
    // Pour un admin non super_admin, il ne peut pas modifier la liste des admins
    // (il ne peut ni ajouter ni retirer d'admin, même lui-même)

    // Empêcher la suppression du dernier super_admin admin du groupe
    const adminsAfterUpdate = newAdminIds.filter((id) =>
      superAdminIds.includes(id),
    );
    if (adminsAfterUpdate.length === 0) {
      throw new BadRequestException(
        'Il doit toujours rester au moins un super_admin admin du groupe.',
      );
    }

    // Si admin (non super_admin), il ne peut pas modifier la liste des admins (ajout/suppression)
    if (!isSuperAdmin && isGroupAdmin && updateGroupDto.adminIds) {
      // Vérifie si la liste reçue est différente de la liste actuelle
      const currentAdminIds = group.admins.map((a) => a.id).sort();
      const requestedAdminIds = Array.from(
        new Set(updateGroupDto.adminIds),
      ).sort();
      const isSame =
        currentAdminIds.length === requestedAdminIds.length &&
        currentAdminIds.every((id, idx) => id === requestedAdminIds[idx]);
      if (!isSame) {
        throw new ForbiddenException(
          "Seul un super_admin peut modifier la liste des admins d'un groupe.",
        );
      }
    }

    // Gestion des membres (users)
    const newUserIds = updateGroupDto.userIds
      ? Array.from(new Set(updateGroupDto.userIds))
      : group.users.map((u) => u.id);

    // Gestion des permissions
    if (updateGroupDto.permissions) {
      // Seul super_admin ou admin du groupe peut modifier les permissions
      if (!isSuperAdmin && !isGroupAdmin) {
        throw new ForbiddenException(
          'Vous ne pouvez pas modifier les permissions de ce groupe.',
        );
      }
      // On suppose qu'il n'y a qu'un seul groupPermission par groupe (comme à la création)
      const groupPerm = group.permissions[0];
      if (groupPerm) {
        // Update appsPerm
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
        // Update dashPerm
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
        // Update mediaPerm
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

    // Gestion des settings
    if (updateGroupDto.settings) {
      // On récupère le GroupSetting lié au groupe (relation 1-1)
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

    // Mise à jour du groupe
    const updateData: any = {
      admins: { set: newAdminIds.map((id) => ({ id })) },
      users: { set: newUserIds.map((id) => ({ id })) },
    };
    // On n'autorise la mise à jour du nom que pour un groupe non système
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
      include: {
        users: { select: { id: true, name: true, pseudo: true, email: true } },
        admins: { select: { id: true, name: true, pseudo: true, email: true } },
        permissions: {
          include: {
            appsPerm: true,
            dashPerm: true,
            mediaPerm: true,
          },
        },
        settings: true,
      },
    });
    return updatedGroup;
  }

  async remove(id: number, user: any) {
    // Récupérer le groupe
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { admins: true, users: true, permissions: true },
    });
    if (!group) throw new BadRequestException('Groupe introuvable');
    // Empêcher la suppression d'un groupe système
    if (group.system) {
      throw new ForbiddenException(
        'Impossible de supprimer un groupe système.',
      );
    }
    // Vérifier droits : super_admin ou admin du groupe
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: SystemGroup.SUPER_ADMIN },
    });
    const isSuperAdmin = user.groupIds?.includes(superAdminGroup?.id);
    const isGroupAdmin = group.admins.some((a) => a.id === user.sub);
    if (!isSuperAdmin && !isGroupAdmin) {
      throw new ForbiddenException(
        "Vous n'avez pas le droit de supprimer ce groupe.",
      );
    }
    // Supprimer explicitement les liens many-to-many
    await this.prisma.group.update({
      where: { id },
      data: {
        users: { set: [] },
        admins: { set: [] },
        permissions: { set: [] },
      },
    });
    // Supprimer explicitement le GroupSetting lié (sécurité si cascade non actif)
    await this.prisma.groupSetting.deleteMany({ where: { groupId: id } });
    // Suppression du groupe
    await this.prisma.group.delete({ where: { id } });
    return { success: true };
  }
}
