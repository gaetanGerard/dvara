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
  private static superAdminGroupIdCache: number | null = null;

  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

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

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    await this.usersService.create(createUserDto);
    return this.authService.validateUser(
      createUserDto.email,
      createUserDto.password,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: Request & { user?: any }) {
    const user = req.user;
    const superAdminGroupId = await this.getSuperAdminGroupId();
    if (!user?.groupIds?.includes(superAdminGroupId)) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour accéder à cette ressource.",
      );
    }
    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const user = req.user;
    const userId = parseInt(id, 10);
    const superAdminGroupId = await this.getSuperAdminGroupId();
    // Autorisé si SUPER_ADMIN ou self
    if (!user?.groupIds?.includes(superAdminGroupId) && user?.sub !== userId) {
      throw new ForbiddenException(
        "Vous n'avez pas les droits pour accéder à cette ressource.",
      );
    }
    return this.usersService.findOne(userId);
  }

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
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre compte.',
      );
    }
    return this.usersService.update(userId, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Req() req: Request & { user?: any }, @Param('id') id: string) {
    const user = req.user;
    const userId = parseInt(id, 10);
    const superAdminGroupId = await this.getSuperAdminGroupId();
    // Récupérer l'utilisateur cible
    const targetUser = await this.usersService.findOne(userId);
    const isTargetSuperAdmin = Array.isArray(targetUser.groups)
      ? targetUser.groups.some(
          (g: { id: number }) => g.id === superAdminGroupId,
        )
      : false;
    // Si l'utilisateur cible est SUPER_ADMIN et qu'il n'y a qu'un seul membre SUPER_ADMIN, refuser la suppression
    if (isTargetSuperAdmin) {
      // Compter le nombre de membres du groupe SUPER_ADMIN
      const superAdminGroup = await (
        this.usersService as any
      ).prisma.group.findUnique({
        where: { id: superAdminGroupId },
        include: { users: true },
      });
      if (superAdminGroup && superAdminGroup.users.length <= 1) {
        throw new ForbiddenException(
          'Impossible de supprimer le dernier membre du groupe SUPER_ADMIN.',
        );
      }
    }
    // Autoriser si SUPER_ADMIN ou self
    if (!user?.groupIds?.includes(superAdminGroupId) && user?.sub !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que votre propre compte.',
      );
    }
    return this.usersService.remove(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/security/change-password')
  async changePassword(
    @Req() req: Request & { user?: any },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto,
  ) {
    const user = req.user;
    // Seul l'utilisateur lui-même peut changer son mot de passe
    if (!user || user.sub !== id) {
      throw new ForbiddenException(
        'Vous ne pouvez changer que votre propre mot de passe.',
      );
    }
    return this.usersService.changePassword(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reset-password')
  async resetPassword(
    @Req() req: Request & { user?: any },
    @Param('id') id: string,
  ) {
    const user = req.user;
    const userId = parseInt(id, 10);
    const superAdminGroupId = await this.getSuperAdminGroupId();
    // Autorisé si SUPER_ADMIN ou si self
    if (!user?.groupIds?.includes(superAdminGroupId) && user?.sub !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez réinitialiser que votre propre mot de passe.',
      );
    }
    return this.usersService.resetPassword(userId);
  }
}
