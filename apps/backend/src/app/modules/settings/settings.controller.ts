/**
 * SettingsController exposes all API endpoints for global application settings management.
 * - Handles retrieval and update of global settings (theme, colors, title, etc.).
 * - Provides a dedicated endpoint for secure logo upload and management.
 * - All endpoints are restricted to super_admin users only.
 *
 * Main endpoints:
 *   - GET /settings: Retrieve global settings
 *   - PATCH /settings: Update allowed global settings fields
 *   - PATCH /settings/logo/upload: Upload and update the application logo (deletes previous logo if needed)
 *
 * All errors are handled with explicit exceptions for robust API behavior.
 */
import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async findAll(@Req() req: any) {
    this.checkSuperAdmin(req.user);
    return this.settingsService.findAll();
  }

  @Patch()
  async update(@Req() req: any, @Body() updateSettingDto: UpdateSettingDto) {
    this.checkSuperAdmin(req.user);
    return this.settingsService.update(updateSettingDto);
  }

  @Patch('logo/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(
    @Req() req: any,
    @UploadedFile() file: any,
    @Body() body: any,
  ) {
    this.checkSuperAdmin(req.user);
    if (!file) throw new BadRequestException('No file uploaded');
    // Use logo_name if provided, else use originalname
    const fileName =
      body.logo_name && body.logo_name.trim()
        ? body.logo_name.trim().replace(/\s+/g, '_') +
          path.extname(String(file.originalname))
        : String(file.originalname);
    const uploadPath = './uploads/logo';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    const filePath = path.join(uploadPath, fileName);

    // Retrieve current logo before update
    const settings = await this.settingsService.findAll();
    const currentLogo = settings.logo;
    const defaultLogo = '/uploads/logo/dvara_app_logo.png';

    fs.writeFileSync(filePath, Buffer.from(file.buffer));
    await this.settingsService.updateLogo({
      logo: `/uploads/logo/${fileName}`,
      logo_name: body.logo_name || fileName,
      logo_alt: body.logo_alt || 'logo',
    });

    // Delete previous logo if it is not the default and not the same as the new one
    if (
      currentLogo &&
      currentLogo !== defaultLogo &&
      currentLogo !== `/uploads/logo/${fileName}`
    ) {
      const oldLogoFile = path.basename(currentLogo); // only the file name
      const oldLogoPath = path.join(uploadPath, oldLogoFile); // same logic as upload
      if (fs.existsSync(oldLogoPath)) {
        try {
          fs.unlinkSync(oldLogoPath);
        } catch (err) {
          console.error('Error while deleting previous logo:', err);
        }
      }
    }

    // Return full logo object (url, name, alt)
    return {
      url: `/uploads/logo/${fileName}`,
      name: body.logo_name || fileName,
      alt: body.logo_alt || 'logo',
    };
  }

  private checkSuperAdmin(user: any) {
    if (!user?.groupIds?.includes(1)) {
      throw new BadRequestException('Only super_admin can access settings');
    }
  }
}
