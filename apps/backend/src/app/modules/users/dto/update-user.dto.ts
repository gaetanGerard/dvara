/**
 * Data Transfer Object for updating a user.
 * Inherits validation rules from CreateUserDto, all fields optional.
 */
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
