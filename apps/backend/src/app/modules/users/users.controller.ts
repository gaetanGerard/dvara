/**
 * UsersController exposes all user-related API endpoints.
 * - Handles user creation, update, deletion, password management, and media association.
 * - Secures routes with JWT authentication and group-based access control.
 * - Delegates business logic to UsersService and MediaService.
 *
 * Main endpoints:
 *   - POST /users: Create a new user
 *   - GET /users: List all users (SUPER_ADMIN only)
 *   - GET /users/:id: Get a user by id (SUPER_ADMIN or self)
 *   - PATCH /users/:id: Update a user
 *   - DELETE /users/:id: Delete a user
 *   - PATCH /users/:id/change-password: Change password (self)
 *   - PATCH /users/:id/reset-password: Request password reset (SUPER_ADMIN or self)
 *   - PATCH /users/:id/media: Associate, dissociate, or upload a media for the user
 *
 * All errors are handled with explicit exceptions for robust API behavior.
 *
 * Usage example:
 *   const user = await usersController.create(createUserDto);
 *   const users = await usersController.findAll(req);
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
  Req,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';
import { Group } from '../../common/enums/group.enums';
import { MediaService } from '../media/media.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  // Cache for SUPER_ADMIN group id
  private static superAdminGroupIdCache: number | null = null;

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly mediaService: MediaService,
  ) {
    (this.usersService as any).mediaService = mediaService;
  }

  // Get SUPER_ADMIN group id (cached)
  private async getSuperAdminGroupId(): Promise<number> {
    if (UsersController.superAdminGroupIdCache !== null) {
      return UsersController.superAdminGroupIdCache;
    }
    const group = await this.usersService['prisma'].group.findUnique({
      where: { name: Group.SUPER_ADMIN },
    });
    if (!group) throw new ForbiddenException('SUPER_ADMIN group not found');
    UsersController.superAdminGroupIdCache = group.id;
    return group.id;
  }

  // Create a new user and return auth tokens
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    await this.usersService.create(createUserDto);
    return this.authService.validateUser(
      createUserDto.email,
      createUserDto.password,
    );
  }

  // List all users (SUPER_ADMIN only)
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: Request & { user?: any }) {
    const user = req.user;
    const superAdminGroupId = await this.getSuperAdminGroupId();
    if (!user?.groupIds?.includes(superAdminGroupId)) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }
    return this.usersService.findAll();
  }

  // Get a user by id (SUPER_ADMIN or self)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const user = req.user;
    const userId = parseInt(id, 10);
    const superAdminGroupId = await this.getSuperAdminGroupId();
    if (!user?.groupIds?.includes(superAdminGroupId) && user?.sub !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this resource.',
      );
    }
    return this.usersService.findOne(userId);
  }

  // Update own user data
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = req.user;
    const userId = parseInt(id, 10);
    if (user?.sub !== userId) {
      throw new ForbiddenException('You can only update your own account.');
    }
    return this.usersService.update(userId, updateUserDto);
  }

  // Delete a user (SUPER_ADMIN or self, with last SUPER_ADMIN protection)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const user = req.user;
    const userId = parseInt(id, 10);
    const superAdminGroupId = await this.getSuperAdminGroupId();
    // Check if target is SUPER_ADMIN
    const targetUser = await this.usersService.findOne(userId);
    const isTargetSuperAdmin = Array.isArray(targetUser.groups)
      ? targetUser.groups.some(
          (g: { id: number }) => g.id === superAdminGroupId,
        )
      : false;
    // Prevent deleting last SUPER_ADMIN
    if (isTargetSuperAdmin) {
      const superAdminGroup = await (
        this.usersService as any
      ).prisma.group.findUnique({
        where: { id: superAdminGroupId },
        include: { users: true },
      });
      if (superAdminGroup && superAdminGroup.users.length <= 1) {
        throw new ForbiddenException(
          'Cannot delete the last SUPER_ADMIN member.',
        );
      }
    }
    if (!user?.groupIds?.includes(superAdminGroupId) && user?.sub !== userId) {
      throw new ForbiddenException('You can only delete your own account.');
    }
    return this.usersService.remove(userId);
  }

  // Change own password
  @UseGuards(JwtAuthGuard)
  @Patch(':id/security/change-password')
  async changePassword(
    @Req() req: Request & { user?: any },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto,
  ) {
    const user = req.user;
    if (!user || user.sub !== id) {
      throw new ForbiddenException('You can only change your own password.');
    }
    return this.usersService.changePassword(id, dto);
  }

  // Request password reset (SUPER_ADMIN or self)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/reset-password')
  async resetPassword(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
  ) {
    const user = req.user;
    const userId = parseInt(id, 10);
    const superAdminGroupId = await this.getSuperAdminGroupId();
    if (!user?.groupIds?.includes(superAdminGroupId) && user?.sub !== userId) {
      throw new ForbiddenException('You can only reset your own password.');
    }
    return this.usersService.resetPassword(userId);
  }

  /**
   * Associates, dissociates, or uploads a media for the user (profile image).
   * - If mediaId is provided: associates this media
   * - If a file is uploaded: delegates to MediaController (POST /media/upload) then associates
   * - If deleteMedia: true and mediaId is null: dissociates and deletes the media
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/media')
  @UseInterceptors(FileInterceptor('file'))
  async setUserMedia(
    @Req() req: Request & { user?: any },
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
    const user = req.user;
    const userId = parseInt(id, 10);
    if (user?.sub !== userId) {
      throw new ForbiddenException('You can only update your own image.');
    }
    // Case 1: delete the media (dissociate and remove file/db if needed)
    if (body.mediaId === null && body.deleteMedia) {
      const userData = await this.usersService.findOne(userId);
      const currentMediaId = userData.media?.id;
      await this.usersService.update(userId, { mediaId: null });
      if (currentMediaId && typeof currentMediaId === 'number') {
        await this.mediaService.remove(currentMediaId);
      }
      return { message: 'Profile image dissociated and media deleted.' };
    }
    // Case 2: upload a new file (centralized via MediaService)
    if (file) {
      let name: string;
      if (body.name && body.name.trim()) {
        name = String(body.name);
      } else {
        name = String(file.originalname);
      }
      const alt = body.alt ? String(body.alt) : 'profile image';
      // Retrieve the old mediaId
      const userData = await this.usersService.findOne(userId);
      const oldMediaId = userData.media?.id;
      // Centralized upload logic
      const media = await this.mediaService.createFromUpload(file, name, alt);
      await this.usersService.update(userId, { mediaId: media.id });
      // Delete the old media if no longer used
      if (oldMediaId && oldMediaId !== media.id) {
        const oldId = Number(oldMediaId);
        const isUsed = await this.mediaService.isMediaUsedElsewhere(
          oldId,
          userId,
        );
        if (!isUsed) {
          await this.mediaService.remove(oldId);
        }
      }
      return this.usersService.findOne(userId);
    }
    // Case 3: associate an existing media
    if (body.mediaId) {
      return this.usersService.update(userId, { mediaId: body.mediaId });
    }
    // Case 4: simple dissociation
    if (body.mediaId === null) {
      return this.usersService.update(userId, { mediaId: null });
    }
    throw new BadRequestException('No valid action for user media.');
  }
}
