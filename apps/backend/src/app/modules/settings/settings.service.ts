/**
 * SettingsService contains all business logic for managing global application settings.
 * - Handles retrieval and update of global settings (theme, colors, title, etc.).
 * - Provides a dedicated method for updating the application logo and related fields.
 *
 * Main methods:
 *   - findAll: Retrieve the unique global settings row
 *   - update: Update allowed global settings fields (excludes logo fields)
 *   - updateLogo: Update logo, logo_name, and logo_alt fields (used by logo upload route)
 *
 * Throws NotFoundException if the settings row does not exist.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // There should be only one settings row
    const settings = await this.prisma.settings.findFirst();
    if (!settings) {
      throw new NotFoundException('Settings not found');
    }
    return settings;
  }

  async update(updateSettingDto: UpdateSettingDto) {
    // Always update the first (and only) settings row
    const settings = await this.prisma.settings.findFirst();
    if (!settings) {
      throw new NotFoundException('Settings not found');
    }
    // Prevent update of logo, logo_alt, logo_name via this route
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { logo, logo_alt, logo_name, ...safeData } = updateSettingDto as any;
    return this.prisma.settings.update({
      where: { id: settings.id },
      data: safeData,
    });
  }

  async updateLogo(data: {
    logo: string;
    logo_name: string;
    logo_alt?: string;
  }) {
    const settings = await this.prisma.settings.findFirst();
    if (!settings) {
      throw new NotFoundException('Settings not found');
    }
    return this.prisma.settings.update({
      where: { id: settings.id },
      data,
    });
  }
}
