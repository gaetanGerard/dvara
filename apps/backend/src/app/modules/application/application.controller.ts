/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * ApplicationController exposes all API endpoints related to application management.
 * - Handles creation, retrieval, update, and deletion of applications.
 * - Secures endpoints with JWT authentication.
 *
 * Main endpoints:
 *   - POST /application: Create a new application
 *   - GET /application: List all applications
 *   - GET /application/:id: Get a specific application by ID
 *   - PATCH /application/:id: Update an application
 *   - DELETE /application/:id: Delete an application and its media if unused
 *   - PATCH /application/:id/media: Manage application icon (upload, associate, dissociate)
 *
 * All errors are handled with explicit exceptions for robust API behavior.
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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequirePermission } from '../../common/shared/require-permission.decorator';
import { PermissionGuard } from '../../common/shared/permission.guard';

@UseGuards(JwtAuthGuard)
@Controller('application')
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @UseGuards(PermissionGuard)
  @RequirePermission({ resource: 'application', action: 'canAdd' })
  create(@Body() createApplicationDto: CreateApplicationDto) {
    return this.applicationService.create(createApplicationDto);
  }

  @Get()
  @UseGuards(PermissionGuard)
  @RequirePermission({ resource: 'application', action: 'canView' })
  findAll() {
    return this.applicationService.findAll();
  }

  @Get(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission({ resource: 'application', action: 'canView' })
  findOne(@Param('id') id: string) {
    return this.applicationService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission({ resource: 'application', action: 'canEdit' })
  update(
    @Param('id') id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ) {
    return this.applicationService.update(+id, updateApplicationDto);
  }

  @Delete(':id')
  @UseGuards(PermissionGuard)
  @RequirePermission({ resource: 'application', action: 'canDelete' })
  remove(@Param('id') id: string) {
    return this.applicationService.remove(+id);
  }

  @Patch(':id/media')
  @UseGuards(PermissionGuard)
  @RequirePermission({ resource: 'application', action: 'canEdit' })
  @UseInterceptors(FileInterceptor('file'))
  async setApplicationMedia(
    @Param('id') id: string,
    @Body()
    body: {
      mediaId?: number | null;
      deleteMedia?: boolean;
      name?: string;
      alt?: string;
    },
    @UploadedFile() file?: any,
  ) {
    return this.applicationService.setApplicationMedia(+id, body, file);
  }
}
