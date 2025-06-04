/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * UsersService provides all CRUD operations for users, including secure password handling.
 * - Ensures password hashing, unique email and pseudo validation, and explicit error management.
 * - The password field is always removed from user objects before returning them.
 *
 * Main methods:
 *   - create: Create a user with hashed password and group/adminGroup logic
 *   - findAll: List all users (with relations), password removed
 *   - findOne: Get a user by id (with relations), password removed
 *   - findByEmail: Get a user by email
 *   - update: Update user fields (except password), with unique checks
 *   - remove: Delete a user by id
 *   - changePassword: Change password with old password verification
 *   - resetPassword: Reset password and set reset flag
 *
 * All errors are handled with explicit exceptions for robust API behavior.
 *
 * Usage example:
 *   const user = await usersService.create(createUserDto);
 *   const users = await usersService.findAll();
 *   const updated = await usersService.update(id, updateUserDto);
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import { removePassword } from '../../common/utils/remove-password.util';
import { Language } from '../../common/enums/language.enums';
import { DayOfWeek } from '../../common/enums/dayofweek.enums';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Allow MediaService injection from the controller (for deleteMedia logic)
  mediaService?: any;

  /**
   * Creates a new user with hashed password and unique email validation.
   * @param createUserDto - Data for user creation
   */
  async create(createUserDto: CreateUserDto) {
    try {
      const existing = await this.prisma.user.findUnique({
        where: { email: createUserDto.email },
      });
      if (existing)
        throw new BadRequestException('This email is already in use.');

      const existingPseudo = await this.prisma.user.findUnique({
        where: { pseudo: createUserDto.pseudo },
      });
      if (existingPseudo)
        throw new BadRequestException('This pseudo is already in use.');

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const userCount = await this.prisma.user.count();
      let groupConnect: { id: number }[] = [];
      let adminGroupConnect: { id: number }[] = [];
      if (userCount === 0) {
        const superAdminGroup = await this.prisma.group.findUnique({
          where: { name: 'SUPER_ADMIN' },
        });
        const everyoneGroup = await this.prisma.group.findUnique({
          where: { name: 'EVERYONE' },
        });
        if (superAdminGroup) {
          groupConnect = [{ id: superAdminGroup.id }];
          adminGroupConnect = [{ id: superAdminGroup.id }];
        }
        if (everyoneGroup) {
          groupConnect.push({ id: everyoneGroup.id });
          adminGroupConnect.push({ id: everyoneGroup.id });
        }
      } else {
        const everyoneGroup = await this.prisma.group.findUnique({
          where: { name: 'EVERYONE' },
        });
        if (everyoneGroup) {
          groupConnect = [{ id: everyoneGroup.id }];
        }
      }
      if (createUserDto.groupIds) {
        groupConnect = [
          ...groupConnect,
          ...createUserDto.groupIds.map((id) => ({ id })),
        ];
      }
      if (createUserDto.adminGroupIds) {
        adminGroupConnect = [
          ...adminGroupConnect,
          ...createUserDto.adminGroupIds.map((id) => ({ id })),
        ];
      }

      let languageId = createUserDto.languageId;
      let dayOfWeekId = createUserDto.dayOfWeekId;
      if (!languageId) {
        const lang = await this.prisma.language.findUnique({
          where: { iso: Language.FR },
        });
        if (lang) languageId = lang.id;
      }
      if (!dayOfWeekId) {
        const dow = await this.prisma.dayOfWeek.findUnique({
          where: { name: DayOfWeek.MONDAY },
        });
        if (dow) dayOfWeekId = dow.id;
      }

      const user = await this.prisma.user.create({
        data: {
          name: createUserDto.name,
          pseudo: createUserDto.pseudo,
          email: createUserDto.email,
          password: hashedPassword,
          mediaId: createUserDto.mediaId,
          languageId,
          dayOfWeekId,
          homeDashboard: createUserDto.homeDashboard,
          groups: { connect: groupConnect },
          adminGroups: { connect: adminGroupConnect },
        },
        include: {
          groups: true,
          adminGroups: true,
          language: true,
          dayOfWeek: true,
          media: true,
        },
      });
      const { refreshToken, ...userWithoutRefresh } = user;
      return removePassword({
        ...userWithoutRefresh,
        language: user.language ?? { iso: Language.FR, name: 'Français' },
        dayOfWeek: user.dayOfWeek ?? { name: DayOfWeek.MONDAY },
      });
    } catch (error) {
      const err = error as { code?: string; message?: string };
      throw new BadRequestException(
        err.message || 'Error while creating the user',
      );
    }
  }

  /**
   * Returns all users, excluding their password field.
   */
  async findAll() {
    try {
      const users = await this.prisma.user.findMany({
        include: {
          groups: true,
          adminGroups: true,
          language: true,
          dayOfWeek: true,
          media: true,
        },
      });
      return users.map(removePassword);
    } catch (error) {
      const err = error as { message?: string };
      throw new BadRequestException(
        err.message || 'Error while retrieving users',
      );
    }
  }

  /**
   * Returns a single user by id, excluding the password field.
   * @param id - User id
   */
  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          groups: true,
          adminGroups: true,
          language: true,
          dayOfWeek: true,
          media: true,
        },
      });
      if (!user) throw new NotFoundException('User not found');
      return removePassword(user);
    } catch (error) {
      const err = error as { message?: string };
      throw new BadRequestException(
        err.message || 'Error while retrieving the user',
      );
    }
  }

  /**
   * Finds a user by email.
   * @param email - User email
   */
  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch (error) {
      const err = error as { message?: string };
      throw new BadRequestException(
        err.message ||
          "Errror while retrieving the user by email, maybe the user doesn't exist.",
      );
    }
  }

  /**
   * Updates user data (except password), with unique email validation.
   * @param id - User id
   * @param updateUserDto - Data for update
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      if (updateUserDto.email) {
        const existing = await this.prisma.user.findUnique({
          where: { email: updateUserDto.email },
        });
        if (existing && existing.id !== id)
          throw new BadRequestException('This email is already use.');
      }
      if (updateUserDto.pseudo) {
        const existingPseudo = await this.prisma.user.findUnique({
          where: { pseudo: updateUserDto.pseudo },
        });
        if (existingPseudo && existingPseudo.id !== id)
          throw new BadRequestException('This pseudo is already use.');
      }
      const { password, groupIds, adminGroupIds, ...data } = updateUserDto;

      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined),
      );

      const user = await this.prisma.user.update({
        where: { id },
        data: {
          ...cleanedData,
          groups: groupIds
            ? { set: groupIds.map((id) => ({ id })) }
            : undefined,
          adminGroups: adminGroupIds
            ? { set: adminGroupIds.map((id) => ({ id })) }
            : undefined,
        },
        include: {
          groups: true,
          adminGroups: true,
          language: true,
          dayOfWeek: true,
          media: true,
        },
      });
      return removePassword(user);
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'P2025') throw new NotFoundException('User not found');
      throw new BadRequestException(
        err.message || 'Error while updating the user',
      );
    }
  }

  /**
   * Deletes a user by id.
   * @param id - User id
   */
  async remove(id: number) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { message: 'User deleted' };
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'P2025') throw new NotFoundException('User not found');
      throw new BadRequestException(
        err.message || 'Error while deleting the user',
      );
    }
  }

  /**
   * Changes the password for a user, with old password verification and hashing.
   * @param id - User id
   * @param dto - ChangePasswordDto containing old and new password
   */
  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    if (dto.newPassword.length < 8) {
      throw new BadRequestException(
        'The new password must be at least 8 characters long.',
      );
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
    return { message: 'Password updated successfully' };
  }

  /**
   * Reset the password for a user, clearing the password field and setting a flag.
   * @param userId - User id
   */
  async resetPassword(userId: number) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          password: '',
          refreshToken: null,
          resetPasswordRequested: true,
        },
      });
      return {
        message: 'Password reset request registered.',
      };
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'P2025') throw new NotFoundException('User not found');
      throw new BadRequestException(
        err.message || 'Error while requesting password reset',
      );
    }
  }
}
