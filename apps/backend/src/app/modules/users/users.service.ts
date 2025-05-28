/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * UsersService provides all CRUD operations for users, including secure password handling.
 * It ensures password hashing, unique email validation, and explicit error management.
 * The password field is always removed from user objects before returning them.
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

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
        throw new BadRequestException('Cet email est déjà utilisé.');

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });

      return removePassword(user);
    } catch (error) {
      const err = error as { code?: string; message?: string };
      throw new BadRequestException(
        err.message || "Erreur lors de la création de l'utilisateur",
      );
    }
  }

  /**
   * Returns all users, excluding their password field.
   */
  async findAll() {
    try {
      const users = await this.prisma.user.findMany();
      return users.map(removePassword);
    } catch (error) {
      const err = error as { message?: string };
      throw new BadRequestException(
        err.message || 'Erreur lors de la récupération des utilisateurs',
      );
    }
  }

  /**
   * Returns a single user by id, excluding the password field.
   * @param id - User id
   */
  async findOne(id: number) {
    try {
      const user = await this.prisma.user.findUnique({ where: { id } });
      if (!user) throw new NotFoundException('Utilisateur non trouvé');
      return removePassword(user);
    } catch (error) {
      const err = error as { message?: string };
      throw new BadRequestException(
        err.message || "Erreur lors de la récupération de l'utilisateur",
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
          "Erreur lors de la récupération de l'utilisateur par email",
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
          throw new BadRequestException('Cet email est déjà utilisé.');
      }

      const { password, ...data } = updateUserDto;

      const user = await this.prisma.user.update({
        where: { id },
        data,
      });
      return removePassword(user);
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'P2025')
        throw new NotFoundException('Utilisateur non trouvé');
      throw new BadRequestException(
        err.message || "Erreur lors de la modification de l'utilisateur",
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
      return { message: 'Utilisateur supprimé' };
    } catch (error) {
      const err = error as { code?: string; message?: string };
      if (err.code === 'P2025')
        throw new NotFoundException('Utilisateur non trouvé');
      throw new BadRequestException(
        err.message || "Erreur lors de la suppression de l'utilisateur",
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
    if (!user) throw new NotFoundException('Utilisateur non trouvé');

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Ancien mot de passe incorrect');
    }

    if (dto.newPassword.length < 8) {
      throw new BadRequestException(
        'Le nouveau mot de passe doit contenir au moins 8 caractères.',
      );
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
    return { message: 'Mot de passe mis à jour avec succès' };
  }
}
