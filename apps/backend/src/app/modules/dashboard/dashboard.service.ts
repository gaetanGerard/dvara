/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { UpdateDashboardElementDto } from './dto/update-dashboard-element.dto';
import { UpdateDashboardSectionDto } from './dto/update-dashboard-section.dto';
import { UpdateDashboardApplicationDto } from './dto/update-dashboard-application.dto';

// DRY includes for full dashboard details
export const DASHBOARD_FULL_INCLUDE = {
  owner: {
    select: {
      id: true,
      name: true,
      pseudo: true,
      mediaId: true,
      languageId: true,
      email: true,
    },
  },
  settings: {
    include: {
      general: true,
      layout: true,
      background: true,
      appearance: true,
      access: {
        include: {
          users: true,
          groups: true,
        },
      },
    },
  },
  content: {
    include: {
      applications: { include: { application: true } },
      categories: {
        include: {
          applications: { include: { application: true } },
        },
      },
      sections: {
        include: {
          applications: { include: { application: true } },
        },
      },
      elements: true,
    },
  },
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Handle NotFoundException for a specific entity
   */
  private handleNotFound(entity: string = 'Resource') {
    throw new NotFoundException(`${entity} not found`);
  }

  /**
   * Remove a dashboard and all its related data:
   * @param dashboard complete dashboard (with settings, content, etc.)
   * @param deleteApps remove linked applications ?
   */
  private async deepDeleteDashboard(dashboard: any, deleteApps = false) {
    // 1. Remove all elements
    await this.prisma.dashboardContentElement.deleteMany({
      where: { contentId: dashboard.content.id },
    });
    // 2. Remove all sections
    await this.prisma.dashboardContentSection.deleteMany({
      where: { contentId: dashboard.content.id },
    });
    // 3. Remove all categories
    await this.prisma.dashboardContentCategory.deleteMany({
      where: { contentId: dashboard.content.id },
    });
    // 4. Remove all applications from the dashboard (placeholders)
    await this.prisma.dashboardContentApplication.deleteMany({
      where: { contentId: dashboard.content.id },
    });
    // 5. Remove all access (users/groups)
    await this.prisma.dashboardSettingsAccessUser.deleteMany({
      where: { accessId: dashboard.settings.access?.id },
    });
    await this.prisma.dashboardSettingsAccessGroup.deleteMany({
      where: { accessId: dashboard.settings.access?.id },
    });
    // 6. Remove the access settings itself
    if (dashboard.settings.access?.id) {
      await this.prisma.dashboardSettingsAccess.delete({
        where: { id: dashboard.settings.access.id },
      });
    }
    // 7. Remove the dashboard itself
    await this.prisma.dashboard.delete({ where: { id: dashboard.id } });
    // 8. Remove the main setting object
    await this.prisma.dashboardSettings.delete({
      where: { id: dashboard.settings.id },
    });
    await this.prisma.dashboardSettingsAppearance.delete({
      where: { id: dashboard.settings.appearanceId },
    });
    await this.prisma.dashboardSettingsBackground.delete({
      where: { id: dashboard.settings.backgroundId },
    });
    await this.prisma.dashboardSettingsLayout.delete({
      where: { id: dashboard.settings.layoutId },
    });
    await this.prisma.dashboardSettingsGeneral.delete({
      where: { id: dashboard.settings.generalId },
    });
    await this.prisma.dashboardContent.delete({
      where: { id: dashboard.content.id },
    });
    // 11. Remove applications if requested
    if (deleteApps) {
      const appIds = Array.isArray(dashboard.content.applications)
        ? dashboard.content.applications
            .map((a: { applicationId?: number }) => a.applicationId)
            .filter((id): id is number => typeof id === 'number')
        : [];
      if (appIds.length > 0) {
        await this.prisma.application.deleteMany({
          where: {
            id: { in: appIds },
            // Optional : only delete if not used elsewhere
          },
        });
      }
    }
  }

  /**
   * Create a new dashboard with all required settings and content.
   * @param createDashboardDto Data for dashboard creation (name, public, ...)
   * @param ownerId ID of the user creating the dashboard
   * @returns The created dashboard with all settings and content
   */
  async create(createDashboardDto: CreateDashboardDto, ownerId: number) {
    if (!ownerId || isNaN(ownerId)) {
      throw new Error('ownerId is missing or invalid');
    }
    // 1. Create all required settings sub-objects with default values
    const general = await this.prisma.dashboardSettingsGeneral.create({
      data: { pageTitle: createDashboardDto.name },
    });
    const layout = await this.prisma.dashboardSettingsLayout.create({
      data: {
        layouts: JSON.stringify([
          { name: 'default', breakpoint: 'lg', columns: 12 },
        ]),
      },
    });
    const background = await this.prisma.dashboardSettingsBackground.create({
      data: {
        position: 'FIXED',
        size: 'COVER',
        repeat: 'NO_REPEAT',
      },
    });
    const appearance = await this.prisma.dashboardSettingsAppearance.create({
      data: {
        mainColor: '#1976d2',
        secondaryColor: '#fff',
        iconColor: '#1976d2',
        borderRadius: 'M',
      },
    });
    const settings = await this.prisma.dashboardSettings.create({
      data: {
        generalId: general.id,
        layoutId: layout.id,
        backgroundId: background.id,
        appearanceId: appearance.id,
      },
    });
    // 2. Create empty content
    const content = await this.prisma.dashboardContent.create({ data: {} });
    // 3. Create the dashboard
    const dashboard = await this.prisma.dashboard.create({
      data: {
        name: createDashboardDto.name,
        public: createDashboardDto.public ?? false,
        ownerId,
        settingsId: settings.id,
        contentId: content.id,
      },
      include: DASHBOARD_FULL_INCLUDE,
    });
    // Add link OWNER in DashboardSettingsAccessUser
    // (create access if it doesn't exist)
    let access = await this.prisma.dashboardSettingsAccess.findFirst({
      where: { settings: { id: settings.id } },
    });
    if (!access) {
      access = await this.prisma.dashboardSettingsAccess.create({
        data: { settings: { connect: { id: settings.id } } },
      });
    }
    await this.prisma.dashboardSettingsAccessUser.create({
      data: {
        userId: ownerId,
        permission: 'OWNER',
        accessId: access.id,
      },
    });

    // Add groupe SUPER_ADMIN in DashboardSettingsAccessGroup with permission SUPER_ADMIN
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: 'SUPER_ADMIN' },
      select: { id: true },
    });
    if (superAdminGroup) {
      // check if not present
      const alreadyExists =
        await this.prisma.dashboardSettingsAccessGroup.findFirst({
          where: { accessId: access.id, groupId: superAdminGroup.id },
        });
      if (!alreadyExists) {
        await this.prisma.dashboardSettingsAccessGroup.create({
          data: {
            groupId: superAdminGroup.id,
            permission: 'SUPER_ADMIN',
            accessId: access.id,
          },
        });
      }
    }

    // Return dashboard with settings.access.users and settings.access.groups
    return this.prisma.dashboard.findUnique({
      where: { id: dashboard.id },
      include: DASHBOARD_FULL_INCLUDE,
    });
  }

  /**
   * Get all dashboards with full details (owner, settings, content, access).
   * @returns Array of dashboards
   */
  async findAll() {
    // Return all dashboards with owner filtered, settings, content and access
    const dashboards = await this.prisma.dashboard.findMany({
      include: DASHBOARD_FULL_INCLUDE,
    });
    for (const d of dashboards) {
      if (d.settings?.layout?.layouts) {
        if (typeof d.settings.layout.layouts === 'string') {
          try {
            const temp = d.settings.layout.layouts;
            d.settings.layout.layouts = temp;
          } catch {
            d.settings.layout.layouts = null;
          }
        } else if (
          typeof d.settings.layout.layouts === 'object' &&
          d.settings.layout.layouts !== null &&
          !Array.isArray(d.settings.layout.layouts)
        ) {
          // ok
        } else {
          d.settings.layout.layouts = null;
        }
      }
    }
    return dashboards;
  }

  /**
   * Get a dashboard by its ID with full details (owner, settings, content, access).
   * @param id Dashboard ID
   * @param user Utilisateur courant (pour contrôle d'accès)
   * @returns Dashboard object ou ForbiddenException
   */
  async findOne(id: number, user?: any) {
    // Récupère le dashboard avec tous les détails
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id },
      include: DASHBOARD_FULL_INCLUDE,
    });
    if (!dashboard) this.handleNotFound('Dashboard');
    if (
      dashboard &&
      dashboard.settings &&
      dashboard.settings.layout &&
      dashboard.settings.layout.layouts
    ) {
      if (typeof dashboard.settings.layout.layouts === 'string') {
        try {
          dashboard.settings.layout.layouts = JSON.parse(
            dashboard.settings.layout.layouts,
          );
        } catch {
          dashboard.settings.layout.layouts = null;
        }
      } else if (Array.isArray(dashboard.settings.layout.layouts)) {
        // ok
      } else if (
        typeof dashboard.settings.layout.layouts === 'object' &&
        dashboard.settings.layout.layouts !== null
      ) {
        // ok
      } else {
        dashboard.settings.layout.layouts = null;
      }
    }
    // Strict access control
    if (user && dashboard) {
      const userId = user.id ?? user.sub;
      const userGroupIds: number[] = user.groupIds || [];
      const isOwner = dashboard.owner && dashboard.owner.id === userId;
      // Check SUPER_ADMIN via group
      let isSuperAdmin = false;
      if (userGroupIds.length) {
        const superAdminGroup = await this.prisma.group.findUnique({
          where: { name: 'SUPER_ADMIN' },
          select: { id: true },
        });
        if (superAdminGroup && userGroupIds.includes(superAdminGroup.id)) {
          isSuperAdmin = true;
        }
      }
      // Check explicit access (VIEW, EDIT, FULL_ACCESS)
      let hasAccess = false;
      if (dashboard.settings && dashboard.settings.access) {
        if (
          Array.isArray(dashboard.settings.access.users) &&
          dashboard.settings.access.users.some(
            (u: any) =>
              u.userId === userId &&
              ['VIEW', 'EDIT', 'FULL_ACCESS', 'OWNER'].includes(
                String(u.permission),
              ),
          )
        ) {
          hasAccess = true;
        }
        if (
          Array.isArray(dashboard.settings.access.groups) &&
          dashboard.settings.access.groups.some(
            (g: any) =>
              userGroupIds.includes(Number(g.groupId)) &&
              ['VIEW', 'EDIT', 'FULL_ACCESS', 'OWNER', 'SUPER_ADMIN'].includes(
                String(g.permission),
              ),
          )
        ) {
          hasAccess = true;
        }
      }
      if (!isOwner && !isSuperAdmin && !hasAccess) {
        throw new ForbiddenException(
          'You do not have access to this dashboard.',
        );
      }
    }
    return dashboard;
  }

  /**
   * Update a dashboard's main fields (name, public, pageTitle).
   * @param id Dashboard ID
   * @param updateDashboardDto Fields to update
   * @param user Utilisateur courant (pour contrôle d'accès)
   * @returns The updated dashboard
   */
  async update(id: number, updateDashboardDto: UpdateDashboardDto, user?: any) {
    // Strict access control
    const dashboard = await this.findOne(id, user);
    if (!dashboard) this.handleNotFound('Dashboard');
    // Only OWNER, SUPER_ADMIN, EDIT or FULL_ACCESS can edit
    if (user && dashboard) {
      const userId = user.id ?? user.sub;
      const userGroupIds: number[] = user.groupIds || [];
      const isOwner = dashboard.owner && dashboard.owner.id === userId;
      let isSuperAdmin = false;
      if (userGroupIds.length) {
        const superAdminGroup = await this.prisma.group.findUnique({
          where: { name: 'SUPER_ADMIN' },
          select: { id: true },
        });
        if (superAdminGroup && userGroupIds.includes(superAdminGroup.id)) {
          isSuperAdmin = true;
        }
      }
      let hasEdit = false;
      if (dashboard.settings && dashboard.settings.access) {
        if (
          Array.isArray(dashboard.settings.access.users) &&
          dashboard.settings.access.users.some(
            (u: any) =>
              u.userId === userId &&
              ['EDIT', 'FULL_ACCESS', 'OWNER'].includes(String(u.permission)),
          )
        ) {
          hasEdit = true;
        }
        if (
          Array.isArray(dashboard.settings.access.groups) &&
          dashboard.settings.access.groups.some(
            (g: any) =>
              userGroupIds.includes(Number(g.groupId)) &&
              ['EDIT', 'FULL_ACCESS', 'OWNER', 'SUPER_ADMIN'].includes(
                String(g.permission),
              ),
          )
        ) {
          hasEdit = true;
        }
      }
      if (!isOwner && !isSuperAdmin && !hasEdit) {
        throw new ForbiddenException(
          'You do not have the right to edit this dashboard.',
        );
      }
    }
    // Update simple fields: name, public
    const { name, public: isPublic, ...rest } = updateDashboardDto;
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (isPublic !== undefined) data.public = isPublic;
    // Update dashboard main fields
    const updated = await this.prisma.dashboard.update({
      where: { id },
      data,
      include: DASHBOARD_FULL_INCLUDE,
    });
    // Optionally, update settings.general if pageTitle is provided
    if (updateDashboardDto.pageTitle) {
      await this.prisma.dashboardSettingsGeneral.update({
        where: { id: updated.settings.general.id },
        data: { pageTitle: updateDashboardDto.pageTitle },
      });
      // Refresh dashboard with updated settings
      return this.prisma.dashboard.findUnique({
        where: { id },
        include: DASHBOARD_FULL_INCLUDE,
      });
    }
    return updated;
  }

  /**
   * Add an application placeholder to the dashboard content.
   * @param dashboardId Dashboard ID
   * @param dto Application data (applicationId, order, size, ...)
   * @returns The created DashboardContentApplication
   */
  async addApplication(
    dashboardId: number,
    dto: {
      applicationId?: number;
      order?: number;
      size?: string;
      position?: string;
      layoutData?: any;
    },
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    const contentId = await this.getDashboardContentId(dashboardId);
    // DashboardContentApplication have an 'order' field, we keep it here
    const contentApp = await this.prisma.dashboardContentApplication.create({
      data: {
        applicationId: dto.applicationId ?? null,
        order: dto.order ?? 0,
        size: dto.size,
        position: dto.position,
        layoutData: dto.layoutData,
        contentId,
      },
    });
    return contentApp;
  }

  /**
   * Link an existing application to a placeholder (DashboardContentApplication).
   * @param dashboardId Dashboard ID
   * @param contentAppId Placeholder ID
   * @param applicationId Application ID to link
   * @returns The updated DashboardContentApplication
   */
  async linkApplication(
    dashboardId: number,
    contentAppId: number,
    applicationId: number,
  ) {
    const contentApp = await this.prisma.dashboardContentApplication.findUnique(
      {
        where: { id: contentAppId },
        select: { contentId: true },
      },
    );
    if (!contentApp) return this.handleNotFound('DashboardContentApplication');
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { contentId: true },
    });
    if (!dashboard || contentApp.contentId !== dashboard.contentId) {
      return this.handleNotFound('DashboardContentApplication');
    }
    return this.prisma.dashboardContentApplication.update({
      where: { id: contentAppId },
      data: { applicationId },
    });
  }

  /**
   * Remove an application or placeholder from the dashboard.
   * @param dashboardId Dashboard ID
   * @param contentAppId Application link ID
   * @returns Success message
   */
  async removeApplication(dashboardId: number, contentAppId: number) {
    const contentApp = await this.prisma.dashboardContentApplication.findUnique(
      {
        where: { id: contentAppId },
        select: { contentId: true },
      },
    );
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { contentId: true },
    });
    if (
      !contentApp ||
      !dashboard ||
      contentApp.contentId !== dashboard.contentId
    ) {
      return this.handleNotFound('DashboardContentApplication');
    }
    await this.prisma.dashboardContentApplication.delete({
      where: { id: contentAppId },
    });
    return { message: 'Application removed from the dashboard.' };
  }

  /**
   * Remove a category from the dashboard.
   * @param dashboardId Dashboard ID
   * @param categoryId Category ID
   * @returns Success message
   */
  async removeCategory(dashboardId: number, categoryId: number) {
    const contentApp = await this.prisma.dashboardContentCategory.findUnique({
      where: { id: categoryId },
      select: { contentId: true },
    });
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { contentId: true },
    });
    if (
      !contentApp ||
      !dashboard ||
      contentApp.contentId !== dashboard.contentId
    ) {
      return this.handleNotFound('DashboardContentCategory');
    }
    await this.prisma.dashboardContentCategory.delete({
      where: { id: categoryId },
    });
    return { message: 'Category removed from the dashboard.' };
  }

  /**
   * Remove a section from the dashboard.
   * @param dashboardId Dashboard ID
   * @param sectionId Section ID
   * @returns Success message
   */
  async removeSection(dashboardId: number, sectionId: number) {
    const contentApp = await this.prisma.dashboardContentSection.findUnique({
      where: { id: sectionId },
      select: { contentId: true },
    });
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { contentId: true },
    });
    if (
      !contentApp ||
      !dashboard ||
      contentApp.contentId !== dashboard.contentId
    ) {
      return this.handleNotFound('DashboardContentSection');
    }
    await this.prisma.dashboardContentSection.delete({
      where: { id: sectionId },
    });
    return { message: 'Section removed from the dashboard.' };
  }

  /**
   * Remove an element from the dashboard.
   * @param dashboardId Dashboard ID
   * @param elementId Element ID
   * @returns Success message
   */
  async removeElement(dashboardId: number, elementId: number) {
    const contentApp = await this.prisma.dashboardContentElement.findUnique({
      where: { id: elementId },
      select: { contentId: true },
    });
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { contentId: true },
    });
    if (
      !contentApp ||
      !dashboard ||
      contentApp.contentId !== dashboard.contentId
    ) {
      return this.handleNotFound('DashboardContentElement');
    }
    await this.prisma.dashboardContentElement.delete({
      where: { id: elementId },
    });
    return { message: 'Element removed from the dashboard.' };
  }

  /**
   * Get the contentId for a dashboard (internal helper).
   * @param dashboardId Dashboard ID
   * @returns contentId
   */
  private async getDashboardContentId(dashboardId: number): Promise<number> {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { contentId: true },
    });
    if (!dashboard || dashboard.contentId == null) {
      this.handleNotFound('Dashboard');
      throw new Error('Dashboard not found');
    }
    return dashboard.contentId;
  }

  /**
   * Assert that a content item belongs to the dashboard (internal helper).
   * @param type Content type (element, section, category, application)
   * @param id Content item ID
   * @param dashboardId Dashboard ID
   */
  private async assertBelongsToDashboard(
    type: 'element' | 'section' | 'category' | 'application',
    id: number,
    dashboardId: number,
  ) {
    const dashboard = await this.prisma.dashboard.findUnique({
      where: { id: dashboardId },
      select: { contentId: true },
    });
    if (!dashboard) this.handleNotFound('Dashboard');
    const content = await this.prisma[
      `dashboardContent${type.charAt(0).toUpperCase() + type.slice(1)}`
    ].findUnique({
      where: { id },
      select: { contentId: true },
    });
    if (!content) {
      this.handleNotFound(
        `DashboardContent${type.charAt(0).toUpperCase() + type.slice(1)}`,
      );
      throw new Error('Content not found');
    }
    if (!dashboard || content.contentId !== dashboard.contentId) {
      throw new ForbiddenException(
        `This ${type} does not belong to the dashboard`,
      );
    }
  }

  /**
   * Return all dashboards that the user can access (OWNER, SUPER_ADMIN, etc.)
   * @param userId User ID
   * @param groupIds Array of group IDs
   * @returns Array of dashboards
   */
  async findMyDashboards(userId: number, groupIds: number[] = []) {
    const or: any[] = [
      { ownerId: userId },
      { settings: { access: { users: { some: { userId } } } } },
    ];
    if (groupIds && groupIds.length > 0) {
      or.push({
        settings: {
          access: {
            groups: { some: { groupId: { in: groupIds } } },
          },
        },
      });
    }
    return this.prisma.dashboard.findMany({
      where: { OR: or },
      include: DASHBOARD_FULL_INCLUDE,
    });
  }

  /**
   * Add an application to a dashboard category.
   * @param dashboardId Dashboard ID
   * @param categoryId Category ID
   * @param applicationId Application ID to add
   * @returns The created DashboardContentApplication link
   */
  async addApplicationToCategory(
    dashboardId: number,
    categoryId: number,
    applicationId: number,
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    await this.assertBelongsToDashboard('category', categoryId, dashboardId);
    const contentId = await this.getDashboardContentId(dashboardId);
    const app = await this.prisma.dashboardContentApplication.create({
      data: { applicationId, contentId, order: 0 },
    });
    await this.prisma.dashboardContentCategory.update({
      where: { id: categoryId },
      data: { applications: { connect: { id: app.id } } },
    });
    return app;
  }

  /**
   * Remove an application from a dashboard category.
   * @param dashboardId Dashboard ID
   * @param categoryId Category ID
   * @param appId Application link ID to remove
   * @returns Success message
   */
  async removeApplicationFromCategory(
    dashboardId: number,
    categoryId: number,
    appId: number,
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    await this.assertBelongsToDashboard('category', categoryId, dashboardId);
    await this.prisma.dashboardContentCategory.update({
      where: { id: categoryId },
      data: { applications: { disconnect: { id: appId } } },
    });
    return { message: 'Application removed from category.' };
  }

  /**
   * Update an application link in a dashboard category.
   * @param dashboardId Dashboard ID
   * @param categoryId Category ID
   * @param appId Application link ID
   * @param dto Fields to update (size, position, layoutData, ...)
   * @returns The updated DashboardContentApplication link
   */
  async updateCategoryApplication(
    dashboardId: number,
    categoryId: number,
    appId: number,
    dto: UpdateDashboardApplicationDto,
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    await this.assertBelongsToDashboard('category', categoryId, dashboardId);
    await this.prisma.dashboardContentCategory.findFirstOrThrow({
      where: { id: categoryId, applications: { some: { id: appId } } },
    });
    return this.prisma.dashboardContentApplication.update({
      where: { id: appId },
      data: dto,
    });
  }

  /**
   * Add an application to a dashboard section.
   * @param dashboardId Dashboard ID
   * @param sectionId Section ID
   * @param applicationId Application ID to add
   * @returns The created DashboardContentApplication link
   */
  async addApplicationToSection(
    dashboardId: number,
    sectionId: number,
    applicationId: number,
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    await this.assertBelongsToDashboard('section', sectionId, dashboardId);
    const contentId = await this.getDashboardContentId(dashboardId);
    const app = await this.prisma.dashboardContentApplication.create({
      data: { applicationId, contentId, order: 0 },
    });
    await this.prisma.dashboardContentSection.update({
      where: { id: sectionId },
      data: { applications: { connect: { id: app.id } } },
    });
    return app;
  }

  /**
   * Remove an application from a dashboard section.
   * @param dashboardId Dashboard ID
   * @param sectionId Section ID
   * @param appId Application link ID to remove
   * @returns Success message
   */
  async removeApplicationFromSection(
    dashboardId: number,
    sectionId: number,
    appId: number,
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    await this.assertBelongsToDashboard('section', sectionId, dashboardId);
    await this.prisma.dashboardContentSection.update({
      where: { id: sectionId },
      data: { applications: { disconnect: { id: appId } } },
    });
    return { message: 'Application removed from section.' };
  }

  /**
   * Update an application link in a dashboard section.
   * @param dashboardId Dashboard ID
   * @param sectionId Section ID
   * @param appId Application link ID
   * @param dto Fields to update (size, position, layoutData, ...)
   * @returns The updated DashboardContentApplication link
   */
  async updateSectionApplication(
    dashboardId: number,
    sectionId: number,
    appId: number,
    dto: UpdateDashboardApplicationDto,
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    await this.assertBelongsToDashboard('section', sectionId, dashboardId);
    await this.prisma.dashboardContentSection.findFirstOrThrow({
      where: { id: sectionId, applications: { some: { id: appId } } },
    });
    return this.prisma.dashboardContentApplication.update({
      where: { id: appId },
      data: dto,
    });
  }

  /**
   * Update general settings for a dashboard (title, meta, logo, favicon).
   * @param dashboardId Dashboard ID
   * @param dto Fields to update
   * @returns The updated dashboard
   */
  async updateGeneral(
    dashboardId: number,
    dto: {
      pageTitle?: string;
      metaTitle?: string;
      logoMediaId?: number;
      faviconMediaId?: number;
    },
    user?: any,
  ) {
    const dashboard = await this.findOne(dashboardId);
    if (!dashboard || !dashboard.settings || !dashboard.settings.general) {
      this.handleNotFound('Dashboard');
      return;
    }
    // Vérification des permissions : OWNER, SUPER_ADMIN, FULL_ACCESS
    const userId = user?.id ?? user?.sub;
    const userGroupIds: number[] = user?.groupIds || [];
    const isOwner = dashboard.owner?.id === userId;
    // Vérifie SUPER_ADMIN via groupe
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: 'SUPER_ADMIN' },
      select: { id: true },
    });
    const isSuperAdmin = !!(
      superAdminGroup && userGroupIds.includes(superAdminGroup.id)
    );
    // Vérifie FULL_ACCESS dans les accès users/groups
    let hasFullAccess = false;
    if (dashboard.settings?.access) {
      if (
        dashboard.settings.access.users?.some(
          (u: any) => u.userId === userId && u.permission === 'FULL_ACCESS',
        )
      ) {
        hasFullAccess = true;
      }
      if (
        dashboard.settings.access.groups?.some(
          (g: any) =>
            userGroupIds.includes(Number(g.groupId)) &&
            g.permission === 'FULL_ACCESS',
        )
      ) {
        hasFullAccess = true;
      }
    }
    if (!isOwner && !isSuperAdmin && !hasFullAccess) {
      throw new ForbiddenException(
        'You do not have permission to update general settings of this dashboard.',
      );
    }
    await this.prisma.dashboardSettingsGeneral.update({
      where: { id: dashboard.settings.general.id },
      data: dto,
    });
    return this.findOne(dashboardId);
  }

  /**
   * Update layout settings for a dashboard.
   * @param dashboardId Dashboard ID
   * @param dto Layouts object or string
   * @returns The updated dashboard
   */
  async updateLayout(dashboardId: number, dto: { layouts?: any }) {
    const dashboard = await this.findOne(dashboardId);
    if (!dashboard || !dashboard.settings || !dashboard.settings.layout) {
      this.handleNotFound('Dashboard');
      return;
    }
    let layouts = dto.layouts;
    if (typeof layouts === 'string') {
      try {
        layouts = JSON.parse(layouts);
      } catch {
        layouts = null;
      }
    }
    await this.prisma.dashboardSettingsLayout.update({
      where: { id: dashboard.settings.layout.id },
      data: { layouts },
    });
    return this.findOne(dashboardId);
  }

  /**
   * Update access settings (users/groups) for a dashboard.
   * @param dashboardId Dashboard ID
   * @param dto Users and groups with permissions
   * @param user User performing the update
   * @returns The updated dashboard
   */
  async updateAccessSettings(
    dashboardId: number,
    dto: {
      users?: { userId: number; permission: string }[];
      groups?: { groupId: number; permission: string }[];
    },
    user: any,
  ) {
    const dashboard = await this.findOne(dashboardId);
    if (!dashboard || !dashboard.settings || !dashboard.settings.access) {
      this.handleNotFound('Dashboard');
      return;
    }
    // Strict control: only OWNER or SUPER_ADMIN can update access
    const userId = user?.id ?? user?.sub;
    const userGroupIds: number[] = user?.groupIds || [];
    const isOwner = dashboard.owner?.id === userId;
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: 'SUPER_ADMIN' },
      select: { id: true },
    });
    const isSuperAdmin = !!(
      superAdminGroup && userGroupIds.includes(superAdminGroup.id)
    );
    if (!isOwner && !isSuperAdmin) {
      throw new ForbiddenException(
        'Only the owner or a super_admin can update the access of this dashboard.',
      );
    }
    const accessId = dashboard.settings.access.id;
    if (dto.users) {
      await this.prisma.dashboardSettingsAccessUser.deleteMany({
        where: { accessId },
      });
      for (const u of dto.users) {
        await this.prisma.dashboardSettingsAccessUser.create({
          data: { accessId, userId: u.userId, permission: u.permission as any },
        });
      }
    }
    if (dto.groups) {
      await this.prisma.dashboardSettingsAccessGroup.deleteMany({
        where: { accessId },
      });
      for (const g of dto.groups) {
        await this.prisma.dashboardSettingsAccessGroup.create({
          data: {
            accessId,
            groupId: g.groupId,
            permission: g.permission as any,
          },
        });
      }
    }
    // Ensure SUPER_ADMIN group is always present
    if (superAdminGroup) {
      const already = await this.prisma.dashboardSettingsAccessGroup.findFirst({
        where: { accessId, groupId: superAdminGroup.id },
      });
      if (!already) {
        await this.prisma.dashboardSettingsAccessGroup.create({
          data: {
            accessId,
            groupId: superAdminGroup.id,
            permission: 'SUPER_ADMIN' as any,
          },
        });
      }
    }
    return this.findOne(dashboardId);
  }

  /**
   * Update an application link in the dashboard content.
   * @param dashboardId Dashboard ID
   * @param contentAppId Application link ID
   * @param dto Fields to update
   * @returns The updated DashboardContentApplication
   */
  async updateApplication(
    dashboardId: number,
    contentAppId: number,
    dto: UpdateDashboardApplicationDto,
  ) {
    await this.assertBelongsToDashboard(
      'application',
      contentAppId,
      dashboardId,
    );
    return this.prisma.dashboardContentApplication.update({
      where: { id: contentAppId },
      data: dto,
    });
  }

  /**
   * cleanup of a dashboard (elements, sections, categories, applications, access, settings, content, dashboard)
   * @param id dashboardId
   * @param user user asking to removal
   * @param deleteApps removal of linked application
   */
  async remove(id: number, user: any, deleteApps = false) {
    const dashboard = await this.findOne(id);
    if (!dashboard) this.handleNotFound('Dashboard');

    // --- Check rights ---
    const userId = user?.id ?? user?.sub;
    const userGroupIds: number[] = user?.groupIds || [];
    // 1. OWNER
    const isOwner = dashboard && dashboard.owner?.id === userId;
    // 2. SUPER_ADMIN
    // Retrieve group SUPER_ADMIN and check if user belongs to it
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: 'SUPER_ADMIN' },
      select: { id: true },
    });
    const isSuperAdmin = !!(
      superAdminGroup && userGroupIds.includes(superAdminGroup.id)
    );
    // 3. ADMIN of a group with permission to the dashboard
    let isAdminGroup = false;
    if (dashboard && dashboard.settings?.access?.groups?.length) {
      const adminGroupIds = dashboard.settings.access.groups
        .filter(
          (g: any) =>
            g.permission === 'ADMIN' || g.permission === 'SUPER_ADMIN',
        )
        .map((g: any) => Number(g.groupId));
      isAdminGroup = adminGroupIds.some((gid: number) =>
        userGroupIds.includes(gid),
      );
    }
    if (!isOwner && !isSuperAdmin && !isAdminGroup) {
      throw new ForbiddenException(
        'You do not have the right to delete this dashboard.',
      );
    }
    // --- Cleanup ---
    await this.deepDeleteDashboard(dashboard, deleteApps);
    return { message: 'Dashboard deleted.' };
  }

  /**
   * Add a category to the dashboard.
   * @param dashboardId Dashboard ID
   * @param dto Category data (name, order, ...)
   * @returns The created category
   */
  async addCategory(
    dashboardId: number,
    dto: {
      name: string;
      order?: number;
      size?: string;
      position?: any;
      layoutData?: any;
    },
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    const contentId = await this.getDashboardContentId(dashboardId);
    const category = await this.prisma.dashboardContentCategory.create({
      data: {
        name: dto.name,
        order: dto.order ?? 0,
        size: dto.size,
        position: dto.position,
        layoutData: dto.layoutData,
        contentId,
      },
    });
    return category;
  }

  /**
   * Update a category in the dashboard.
   * @param dashboardId Dashboard ID
   * @param categoryId Category ID
   * @param dto Fields to update
   * @returns The updated category
   */
  async updateCategory(
    dashboardId: number,
    categoryId: number,
    dto: any,
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    await this.assertBelongsToDashboard('category', categoryId, dashboardId);
    return this.prisma.dashboardContentCategory.update({
      where: { id: categoryId },
      data: dto,
    });
  }

  /**
   * Add a section to the dashboard.
   * @param dashboardId Dashboard ID
   * @param dto Section data (name, order, ...)
   * @returns The created section
   */
  async addSection(
    dashboardId: number,
    dto: {
      name: string;
      order?: number;
      size?: string;
      position?: any;
      layoutData?: any;
    },
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    const contentId = await this.getDashboardContentId(dashboardId);
    const section = await this.prisma.dashboardContentSection.create({
      data: {
        name: dto.name,
        order: dto.order ?? 0,
        size: dto.size,
        position: dto.position,
        layoutData: dto.layoutData,
        contentId,
      },
    });
    return section;
  }

  /**
   * Update a section in the dashboard.
   * @param dashboardId Dashboard ID
   * @param sectionId Section ID
   * @param dto Fields to update
   * @returns The updated section
   */
  async updateSection(
    dashboardId: number,
    sectionId: number,
    dto: any,
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    await this.assertBelongsToDashboard('section', sectionId, dashboardId);
    return this.prisma.dashboardContentSection.update({
      where: { id: sectionId },
      data: dto,
    });
  }

  /**
   * Add an element to the dashboard.
   * @param dashboardId Dashboard ID
   * @param dto Element data (type, data, ...)
   * @returns The created element
   */
  async addElement(
    dashboardId: number,
    dto: {
      type: string;
      data?: any;
      size?: string;
      position?: any;
      layoutData?: any;
    },
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    const contentId = await this.getDashboardContentId(dashboardId);
    const element = await this.prisma.dashboardContentElement.create({
      data: {
        type: dto.type,
        data: dto.data,
        size: dto.size,
        position: dto.position,
        layoutData: dto.layoutData,
        contentId,
      },
    });
    return element;
  }

  /**
   * Update an element in the dashboard.
   * @param dashboardId Dashboard ID
   * @param elementId Element ID
   * @param dto Fields to update
   * @returns The updated element
   */
  async updateElement(
    dashboardId: number,
    elementId: number,
    dto: any,
    user: any,
  ) {
    await this.assertCanEditDashboard(dashboardId, user);
    await this.assertBelongsToDashboard('element', elementId, dashboardId);
    return this.prisma.dashboardContentElement.update({
      where: { id: elementId },
      data: dto,
    });
  }

  /**
   * Update background settings for a dashboard.
   * @param dashboardId Dashboard ID
   * @param dto Background fields (position, size, repeat, mediaId)
   * @returns The updated dashboard
   */
  async updateBackground(
    dashboardId: number,
    dto: {
      position?: string;
      size?: string;
      repeat?: string;
      mediaId?: number;
    },
  ) {
    const dashboard = await this.findOne(dashboardId);
    if (!dashboard || !dashboard.settings || !dashboard.settings.background) {
      this.handleNotFound('Dashboard');
      return;
    }
    const data: any = {};
    if (dto.position) data.position = dto.position;
    if (dto.size) data.size = dto.size;
    if (dto.repeat) data.repeat = dto.repeat;
    if (dto.mediaId !== undefined) {
      data.mediaId = dto.mediaId === null ? null : Number(dto.mediaId);
    }
    await this.prisma.dashboardSettingsBackground.update({
      where: { id: dashboard.settings.background.id },
      data,
    });
    return this.findOne(dashboardId);
  }

  /**
   * Update appearance settings for a dashboard.
   * @param dashboardId Dashboard ID
   * @param dto Appearance fields (mainColor, secondaryColor, iconColor, borderRadius)
   * @returns The updated dashboard
   */
  async updateAppearance(
    dashboardId: number,
    dto: {
      mainColor?: string;
      secondaryColor?: string;
      iconColor?: string;
      borderRadius?: string;
    },
  ) {
    const dashboard = await this.findOne(dashboardId);
    if (!dashboard || !dashboard.settings || !dashboard.settings.appearance) {
      this.handleNotFound('Dashboard');
      return;
    }
    const data: any = {};
    if (dto.mainColor) data.mainColor = dto.mainColor;
    if (dto.secondaryColor) data.secondaryColor = dto.secondaryColor;
    if (dto.iconColor) data.iconColor = dto.iconColor;
    if (dto.borderRadius) data.borderRadius = dto.borderRadius as any;
    await this.prisma.dashboardSettingsAppearance.update({
      where: { id: dashboard.settings.appearance.id },
      data,
    });
    return this.findOne(dashboardId);
  }

  /**
   * Check if the user has the right to edit the dashboard (OWNER, SUPER_ADMIN, EDIT, FULL_ACCESS)
   */
  private async assertCanEditDashboard(dashboardId: number, user: any) {
    const dashboard = await this.findOne(dashboardId);
    if (!dashboard) throw new NotFoundException('Dashboard not found');
    const userId = user?.id ?? user?.sub;
    const userGroupIds: number[] = user?.groupIds || [];
    const isOwner = dashboard.owner?.id === userId;
    const superAdminGroup = await this.prisma.group.findUnique({
      where: { name: 'SUPER_ADMIN' },
      select: { id: true },
    });
    const isSuperAdmin = !!(
      superAdminGroup && userGroupIds.includes(Number(superAdminGroup.id))
    );
    let hasEdit = false;
    if (dashboard.settings?.access) {
      if (
        dashboard.settings.access.users?.some(
          (u: { userId: number; permission: string }) =>
            u.userId === userId &&
            ['EDIT', 'FULL_ACCESS'].includes(String(u.permission)),
        )
      ) {
        hasEdit = true;
      }
      if (
        dashboard.settings.access.groups?.some(
          (g: { groupId: number; permission: string }) =>
            userGroupIds.includes(Number(g.groupId)) &&
            ['EDIT', 'FULL_ACCESS'].includes(String(g.permission)),
        )
      ) {
        hasEdit = true;
      }
    }
    if (!isOwner && !isSuperAdmin && !hasEdit) {
      throw new ForbiddenException(
        'You do not have permission to modify this dashboard.',
      );
    }
  }
}
