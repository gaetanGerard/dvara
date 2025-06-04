import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Media } from './entities/media.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { parsePaginationParams } from '../../common/utils/pagination.util';

/**
 * MediaController exposes all media-related API endpoints.
 * - Handles media creation (URL or upload), update, deletion, and retrieval.
 * - Supports paginated listing, file upload, and file replacement.
 * - Secures endpoints with JWT authentication.
 * - Delegates business logic to MediaService.
 *
 * Main endpoints:
 *   - POST /media: Create a media entry (URL only)
 *   - GET /media: List all media (paginated)
 *   - GET /media/:id: Get a media by id
 *   - PATCH /media/:id: Update a media
 *   - DELETE /media/:id: Delete a media
 *   - POST /media/upload: Upload an image file and create a media entry
 *   - PATCH /media/:id/upload: Replace the file and/or fields of an existing media
 *
 * All errors are handled with explicit exceptions for robust API behavior.
 *
 * Usage example:
 *   const media = await mediaController.create(createMediaDto);
 *   const list = await mediaController.findAll(page, limit);
 */
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * Create a media entry (URL only, no upload)
   */
  @Post()
  async create(@Body() createMediaDto: CreateMediaDto): Promise<Media> {
    return this.mediaService.create(createMediaDto);
  }

  /**
   * Returns all media, paginated (pagination required)
   * GET /media?page=1&limit=10 (default: page=1, limit=20)
   */
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<{ data: Media[]; total: number; page: number; limit: number }> {
    const { page: pageNum, limit: limitNum } = parsePaginationParams(
      page,
      limit,
    );
    return this.mediaService.findAllPaginated(pageNum, limitNum);
  }

  /**
   * Returns a media by id
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Media> {
    return await this.mediaService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMediaDto: UpdateMediaDto) {
    return this.mediaService.update(+id, updateMediaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mediaService.remove(+id);
  }

  /**
   * Upload an image file and create a media entry (local storage)
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: any,
    @Body() body: { name?: string; alt?: string },
  ): Promise<Media> {
    if (!file) throw new BadRequestException('No file uploaded');
    const name = body.name?.trim() ? body.name : file.originalname;
    const alt = body.alt || 'media image';
    // Centralizes all upload/naming logic
    return this.mediaService.createFromUpload(file, String(name), String(alt));
  }

  /**
   * PATCH /media/:id/upload
   * Updates an existing media (replace file and/or fields)
   * - If the media is not linked to any user/resource, replaces the file and updates imgName, alt, name, url
   * - If the media is linked to a user, updates fields (except imgName/url if no new file)
   */
  @Patch(':id/upload')
  @UseInterceptors(FileInterceptor('file'))
  async updateMediaFile(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Body() body: { name?: string; alt?: string },
  ): Promise<Media> {
    return await this.mediaService.updateMediaWithFile(+id, file, body);
  }
}
