/**
 * GroupController exposes all group-related API endpoints.
 * - Handles group creation, update, deletion, and retrieval.
 * - Secures endpoints with JWT authentication and group-based access control.
 * - Delegates business logic to GroupService.
 *
 * Main endpoints:
 *   - POST /group: Create a new group
 *   - GET /group: List all groups accessible to the user
 *   - GET /group/:id: Get details of a group by id
 *   - PATCH /group/:id: Update a group (members, admins, permissions, settings)
 *   - DELETE /group/:id: Delete a group
 *
 * All errors are handled with explicit exceptions for robust API behavior.
 *
 * Usage example:
 *   const group = await groupController.create(req, createGroupDto);
 *   const groups = await groupController.findAll(req);
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RequirePermission } from '../../common/shared/require-permission.decorator';
import { PermissionGuard } from '../../common/shared/permission.guard';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // Create a new group
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission({ resource: 'group', action: 'canAdd' })
  @Post()
  async create(@Req() req, @Body() createGroupDto: CreateGroupDto) {
    const user = req.user;
    if (!user?.groupIds?.length) throw new ForbiddenException('Access denied');
    return this.groupService.create(createGroupDto, user);
  }

  // List all groups accessible to the user
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission({ resource: 'group', action: 'canView' })
  @Get()
  async findAll(@Req() req) {
    const user = req.user;
    return this.groupService.findAll(user);
  }

  // Get details of a group by id
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission({ resource: 'group', action: 'canView' })
  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    const user = req.user;
    return this.groupService.findOne(Number(id), user);
  }

  // Update a group
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission({ resource: 'group', action: 'canEdit' })
  @Patch(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body()
    updateGroupDto: {
      userIds?: number[];
      adminIds?: number[];
      permissions?: any;
      settings?: any;
    },
  ) {
    const user = req.user;
    return this.groupService.update(Number(id), updateGroupDto, user);
  }

  // Delete a group
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission({ resource: 'group', action: 'canDelete' })
  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const user = req.user;
    return this.groupService.remove(Number(id), user);
  }
}
