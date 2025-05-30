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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthService } from '../auth/auth.service';
import { Request } from 'express';
import { Group } from '../../common/enums/group.enums';

@Controller('users')
export class UsersController {
  // Cache for SUPER_ADMIN group id
  private static superAdminGroupIdCache: number | null = null;

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

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
}
