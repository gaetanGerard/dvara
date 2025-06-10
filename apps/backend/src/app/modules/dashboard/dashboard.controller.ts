/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateDashboardElementDto } from './dto/update-dashboard-element.dto';
import { UpdateDashboardApplicationDto } from './dto/update-dashboard-application.dto';
import { UpdateDashboardCategoryDto } from './dto/update-dashboard-category.dto';
import { UpdateDashboardSectionDto } from './dto/update-dashboard-section.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Create a new dashboard.
   * @route POST /dashboard
   * @body createDashboardDto Dashboard creation data (name, public, ...)
   * @returns The created dashboard with all settings and content
   */
  @Post()
  async create(
    @Body() createDashboardDto: CreateDashboardDto,
    @Req() req: any,
  ) {
    // check if user is authenticated and has a valid id
    const userId = req.user?.id ?? req.user?.sub;
    if (!userId || isNaN(Number(userId))) {
      throw new BadRequestException(
        'Authenticated user id is missing or invalid',
      );
    }
    return this.dashboardService.create(createDashboardDto, Number(userId));
  }

  /**
   * Get all dashboards.
   * @route GET /dashboard
   * @returns Array of dashboards
   */
  @Get()
  findAll() {
    return this.dashboardService.findAll();
  }

  /**
   * Get all dashboards accessible to the current user.
   * @route GET /dashboard/my
   * @returns Array of dashboards
   */
  @Get('my')
  async findMyDashboards(@Req() req: any) {
    const userId = req.user?.id ?? req.user?.sub;
    const groupIds = req.user?.groupIds || [];
    return this.dashboardService.findMyDashboards(userId, groupIds);
  }

  /**
   * Get a dashboard by its ID.
   * @route GET /dashboard/:id
   * @param id Dashboard ID (route param)
   * @returns Dashboard object or null if not found
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dashboardService.findOne(+id);
  }

  /**
   * Update a dashboard's main fields (name, public, pageTitle).
   * @route PATCH /dashboard/:id
   * @param id Dashboard ID (route param)
   * @body updateDashboardDto Fields to update
   * @returns The updated dashboard
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDashboardDto: UpdateDashboardDto,
  ) {
    return this.dashboardService.update(+id, updateDashboardDto);
  }

  /**
   * Delete a dashboard (deep delete, with option to delete linked applications).
   * @route DELETE /dashboard/:id
   * @param id Dashboard ID (route param)
   * @query deleteApps (optional) If true, also delete linked applications
   * @returns Success message
   */
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: any,
    @Param() params: any,
    @Query('deleteApps') deleteApps?: string,
  ) {
    const shouldDeleteApps = deleteApps === 'true' || body?.deleteApps === true;
    return await this.dashboardService.remove(+id, req.user, shouldDeleteApps);
  }

  /**
   * Add an application placeholder to the dashboard content.
   * @route POST /dashboard/:id/application
   * @param id Dashboard ID (route param)
   * @body dto Application data (applicationId, order, size, ...)
   * @returns The created DashboardContentApplication
   */
  @Post(':id/application')
  async addApplication(
    @Param('id') id: string,
    @Body()
    dto: {
      applicationId?: number;
      order?: number;
      size?: string;
      position?: string;
      layoutData?: string;
    },
  ) {
    return this.dashboardService.addApplication(Number(id), dto);
  }

  /**
   * Link an existing application to a placeholder (DashboardContentApplication).
   * @route PATCH /dashboard/:id/application/:contentAppId/link
   * @param id Dashboard ID (route param)
   * @param contentAppId Placeholder ID (route param)
   * @body dto { applicationId: number }
   * @returns The updated DashboardContentApplication
   */
  @Patch(':id/application/:contentAppId/link')
  async linkApplication(
    @Param('id') id: string,
    @Param('contentAppId') contentAppId: string,
    @Body() dto: { applicationId: number },
  ) {
    const result = await this.dashboardService.linkApplication(
      Number(id),
      Number(contentAppId),
      dto.applicationId,
    );
    return { success: true, data: result };
  }

  /**
   * Remove an application or placeholder from the dashboard.
   * @route DELETE /dashboard/:id/application/:contentAppId
   * @param id Dashboard ID (route param)
   * @param contentAppId Application link ID (route param)
   * @returns Success message
   */
  @Delete(':id/application/:contentAppId')
  async removeApplication(
    @Param('id') id: string,
    @Param('contentAppId') contentAppId: string,
  ) {
    return await this.dashboardService.removeApplication(
      Number(id),
      Number(contentAppId),
    );
  }

  /**
   * Add a category to the dashboard.
   * @route POST /dashboard/:id/category
   * @param id Dashboard ID (route param)
   * @body dto Category data (name, order, ...)
   * @returns The created category
   */
  @Post(':id/category')
  async addCategory(
    @Param('id') id: string,
    @Body() dto: { name: string; order?: number },
  ) {
    return await this.dashboardService.addCategory(Number(id), dto);
  }

  /**
   * Update a category in the dashboard.
   * @route PATCH /dashboard/:id/category/:categoryId
   * @param id Dashboard ID (route param)
   * @param categoryId Category ID (route param)
   * @body dto Fields to update
   * @returns The updated category
   */
  @Patch(':id/category/:categoryId')
  async updateCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateDashboardCategoryDto,
  ) {
    return await this.dashboardService.updateCategory(
      Number(id),
      Number(categoryId),
      dto,
    );
  }

  /**
   * Delete a category from the dashboard.
   * @route DELETE /dashboard/:id/category/:categoryId
   * @param id Dashboard ID (route param)
   * @param categoryId Category ID (route param)
   * @returns Success message
   */
  @Delete(':id/category/:categoryId')
  async removeCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
  ) {
    return this.dashboardService.removeCategory(Number(id), Number(categoryId));
  }

  /**
   * Add an application to a dashboard category.
   * @route POST /dashboard/:id/category/:categoryId/application
   * @param id Dashboard ID (route param)
   * @param categoryId Category ID (route param)
   * @body { applicationId: number } - The application to add
   * @returns { success: true, data: DashboardContentApplication } The created link object
   */
  @Post(':id/category/:categoryId/application')
  async addApplicationToCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Body() dto: { applicationId: number },
  ) {
    const app = await this.dashboardService.addApplicationToCategory(
      Number(id),
      Number(categoryId),
      dto.applicationId,
    );
    return { success: true, data: app };
  }

  /**
   * Remove an application from a dashboard category.
   * @route DELETE /dashboard/:id/category/:categoryId/application/:appId
   * @param id Dashboard ID (route param)
   * @param categoryId Category ID (route param)
   * @param appId Application link ID (route param)
   * @returns { message: string } Success message
   */
  @Delete(':id/category/:categoryId/application/:appId')
  async removeApplicationFromCategory(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Param('appId') appId: string,
  ) {
    return await this.dashboardService.removeApplicationFromCategory(
      Number(id),
      Number(categoryId),
      Number(appId),
    );
  }

  /**
   * Update an application link in a dashboard category.
   * @route PATCH /dashboard/:id/category/:categoryId/application/:appId
   * @param id Dashboard ID (route param)
   * @param categoryId Category ID (route param)
   * @param appId Application link ID (route param)
   * @body UpdateDashboardApplicationDto - Fields to update (size, position, layoutData, ...)
   * @returns { success: true, data: DashboardContentApplication } The updated link object
   */
  @Patch(':id/category/:categoryId/application/:appId')
  async updateCategoryApplication(
    @Param('id') id: string,
    @Param('categoryId') categoryId: string,
    @Param('appId') appId: string,
    @Body() dto: UpdateDashboardApplicationDto,
  ) {
    const result = await this.dashboardService.updateCategoryApplication(
      Number(id),
      Number(categoryId),
      Number(appId),
      dto,
    );
    return { success: true, data: result };
  }

  /**
   * Add a section to the dashboard.
   * @route POST /dashboard/:id/section
   * @param id Dashboard ID (route param)
   * @body dto Section data (name, order, ...)
   * @returns The created section
   */
  @Post(':id/section')
  async addSection(
    @Param('id') id: string,
    @Body() dto: { name: string; order?: number },
  ) {
    return await this.dashboardService.addSection(Number(id), dto);
  }

  /**
   * Update a section in the dashboard.
   * @route PATCH /dashboard/:id/section/:sectionId
   * @param id Dashboard ID (route param)
   * @param sectionId Section ID (route param)
   * @body dto Fields to update
   * @returns The updated section
   */
  @Patch(':id/section/:sectionId')
  async updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateDashboardSectionDto,
  ) {
    return await this.dashboardService.updateSection(
      Number(id),
      Number(sectionId),
      dto,
    );
  }

  /**
   * Delete a section from the dashboard.
   * @route DELETE /dashboard/:id/section/:sectionId
   * @param id Dashboard ID (route param)
   * @param sectionId Section ID (route param)
   * @returns Success message
   */
  @Delete(':id/section/:sectionId')
  async removeSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.dashboardService.removeSection(Number(id), Number(sectionId));
  }

  /**
   * Update an application link in a dashboard section.
   * @route PATCH /dashboard/:id/section/:sectionId/application/:appId
   * @param id Dashboard ID (route param)
   * @param sectionId Section ID (route param)
   * @param appId Application link ID (route param)
   * @body UpdateDashboardApplicationDto - Fields to update
   * @returns The updated DashboardContentApplication
   */
  @Patch(':id/section/:sectionId/application/:appId')
  async updateSectionApplication(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Param('appId') appId: string,
    @Body() dto: UpdateDashboardApplicationDto,
  ) {
    return await this.dashboardService.updateSectionApplication(
      Number(id),
      Number(sectionId),
      Number(appId),
      dto,
    );
  }

  /**
   * Add an application to a dashboard section.
   * @route POST /dashboard/:id/section/:sectionId/application
   * @param id Dashboard ID (route param)
   * @param sectionId Section ID (route param)
   * @body { applicationId: number } - The application to add
   * @returns The created DashboardContentApplication
   */
  @Post(':id/section/:sectionId/application')
  async addApplicationToSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: { applicationId: number },
  ) {
    return await this.dashboardService.addApplicationToSection(
      Number(id),
      Number(sectionId),
      dto.applicationId,
    );
  }

  /**
   * Remove an application from a dashboard section.
   * @route DELETE /dashboard/:id/section/:sectionId/application/:appId
   * @param id Dashboard ID (route param)
   * @param sectionId Section ID (route param)
   * @param appId Application link ID (route param)
   * @returns Success message
   */
  @Delete(':id/section/:sectionId/application/:appId')
  async removeApplicationFromSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Param('appId') appId: string,
  ) {
    return await this.dashboardService.removeApplicationFromSection(
      Number(id),
      Number(sectionId),
      Number(appId),
    );
  }

  /**
   * Add an element to the dashboard.
   * @route POST /dashboard/:id/element
   * @param id Dashboard ID (route param)
   * @body dto Element data (type, data, ...)
   * @returns The created element
   */
  @Post(':id/element')
  async addElement(
    @Param('id') id: string,
    @Body() dto: { type: string; data?: any; order?: number },
  ) {
    return await this.dashboardService.addElement(Number(id), dto);
  }

  /**
   * Update an element in the dashboard.
   * @route PATCH /dashboard/:id/element/:elementId
   * @param id Dashboard ID (route param)
   * @param elementId Element ID (route param)
   * @body dto Fields to update
   * @returns The updated element
   */
  @Patch(':id/element/:elementId')
  async updateElement(
    @Param('id') id: string,
    @Param('elementId') elementId: string,
    @Body() dto: UpdateDashboardElementDto,
  ) {
    const result = await this.dashboardService.updateElement(
      Number(id),
      Number(elementId),
      dto,
    );
    if (!result) throw new BadRequestException('Element update failed');
    return result;
  }

  /**
   * Delete an element from the dashboard.
   * @route DELETE /dashboard/:id/element/:elementId
   * @param id Dashboard ID (route param)
   * @param elementId Element ID (route param)
   * @returns Success message
   */
  @Delete(':id/element/:elementId')
  async removeElement(
    @Param('id') id: string,
    @Param('elementId') elementId: string,
  ) {
    return this.dashboardService.removeElement(Number(id), Number(elementId));
  }

  /**
   * Update general settings for a dashboard (title, meta, logo, favicon).
   * @route PATCH /dashboard/:id/settings/general
   * @param id Dashboard ID (route param)
   * @body dto Fields to update
   * @returns The updated dashboard
   */
  @Patch(':id/settings/general')
  async updateGeneral(
    @Param('id') id: string,
    @Body()
    dto: {
      pageTitle?: string;
      metaTitle?: string;
      logoMediaId?: number;
      faviconMediaId?: number;
    },
  ) {
    return await this.dashboardService.updateGeneral(Number(id), dto);
  }

  /**
   * Update layout settings for a dashboard.
   * @route PATCH /dashboard/:id/settings/layout
   * @param id Dashboard ID (route param)
   * @body dto Layouts object or string
   * @returns The updated dashboard
   */
  @Patch(':id/settings/layout')
  async updateLayout(@Param('id') id: string, @Body() dto: { layouts?: any }) {
    return await this.dashboardService.updateLayout(Number(id), dto);
  }

  /**
   * Update background settings for a dashboard.
   * @route PATCH /dashboard/:id/settings/background
   * @param id Dashboard ID (route param)
   * @body dto Background fields (position, size, repeat, mediaId)
   * @returns The updated dashboard
   */
  @Patch(':id/settings/background')
  async updateBackground(
    @Param('id') id: string,
    @Body()
    dto: {
      position?: string;
      size?: string;
      repeat?: string;
      mediaId?: number;
    },
  ) {
    return await this.dashboardService.updateBackground(Number(id), dto);
  }

  /**
   * Update appearance settings for a dashboard.
   * @route PATCH /dashboard/:id/settings/appearance
   * @param id Dashboard ID (route param)
   * @body dto Appearance fields (mainColor, secondaryColor, iconColor, borderRadius)
   * @returns The updated dashboard
   */
  @Patch(':id/settings/appearance')
  async updateAppearance(
    @Param('id') id: string,
    @Body()
    dto: {
      mainColor?: string;
      secondaryColor?: string;
      iconColor?: string;
      borderRadius?: string;
    },
  ) {
    return await this.dashboardService.updateAppearance(Number(id), dto);
  }

  /**
   * Update access settings (users/groups) for a dashboard.
   * @route PATCH /dashboard/:id/settings/access
   * @param id Dashboard ID (route param)
   * @body dto Users and groups with permissions
   * @returns The updated dashboard
   */
  @Patch(':id/settings/access')
  async updateAccessSettings(
    @Param('id') id: string,
    @Req() req: any,
    @Body()
    dto: {
      users?: { userId: number; permission: string }[];
      groups?: { groupId: number; permission: string }[];
    },
  ) {
    return await this.dashboardService.updateAccessSettings(
      Number(id),
      dto,
      req.user,
    );
  }

  /**
   * Update an application link in the dashboard content.
   * @route PATCH /dashboard/:id/application/:contentAppId
   * @param id Dashboard ID (route param)
   * @param contentAppId Application link ID (route param)
   * @body dto Fields to update
   * @returns The updated DashboardContentApplication
   */
  @Patch(':id/application/:contentAppId')
  async updateApplication(
    @Param('id') id: string,
    @Param('contentAppId') contentAppId: string,
    @Body() dto: UpdateDashboardApplicationDto,
  ) {
    return this.dashboardService.updateApplication(
      Number(id),
      Number(contentAppId),
      dto,
    );
  }
}
