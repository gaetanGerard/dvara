/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { Media } from './entities/media.entity';
import * as fs from 'fs';
import * as path from 'path';
import { File as MulterFile } from 'multer';
import { generateUniqueMediaFileName } from '../../common/shared/media.helper';

/**
 * MediaService handles all business logic and data access for media resources.
 * - Manages media creation (URL or upload), update, deletion, and retrieval.
 * - Centralizes file naming, upload, uniqueness, and cleanup logic.
 * - Supports paginated listing and robust file/database consistency.
 *
 * Main methods:
 *   - create: Create a media entry (URL only)
 *   - createFromUpload: Create a media from an uploaded file
 *   - findAll: List all media
 *   - findAllPaginated: List media with pagination
 *   - findOne: Get a media by id
 *   - update: Update a media
 *   - updateMediaWithFile: Replace the file and/or fields of an existing media
 *   - remove: Delete a media and its file if needed
 *   - isMediaUsedElsewhere: Check if a media is used by other resources
 *
 * All errors are handled with explicit exceptions for robust API behavior.
 *
 * Usage example:
 *   const media = await mediaService.create(createMediaDto);
 *   const paged = await mediaService.findAllPaginated(page, limit);
 */
@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a media entry in the database (URL only, no upload)
   */
  async create(createMediaDto: CreateMediaDto): Promise<Media> {
    // Check if a media with the same URL already exists (for URL-only media)
    if (createMediaDto.url && !createMediaDto.imgName) {
      const existing = await this.prisma.media.findFirst({
        where: { url: createMediaDto.url },
      });
      if (existing) {
        throw new BadRequestException('A media with this URL already exists.');
      }
    }
    // Ensure imgName is always defined (empty or unique string)
    const data = { ...createMediaDto, imgName: createMediaDto.imgName ?? '' };
    return (await this.prisma.media.create({ data })) as Media;
  }

  /**
   * Returns all media
   */
  async findAll(): Promise<Media[]> {
    // Manual typing to avoid eslint/no-unsafe-return error
    const medias = await this.prisma.media.findMany({});
    return medias as Media[];
  }

  /**
   * Returns a media by id
   */
  async findOne(id: number): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new BadRequestException('Media not found');
    }
    return media as Media;
  }

  async update(id: number, updateMediaDto: UpdateMediaDto): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new BadRequestException('Media not found');
    }
    return this.prisma.media.update({
      where: { id },
      data: updateMediaDto,
    }) as Promise<Media>;
  }

  async remove(id: number) {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) {
      throw new BadRequestException('Media not found');
    }
    /**
     * Deletes the physical file if it is a local upload
     */
    if (media.imgName) {
      const filePath = path.join('uploads', 'media', String(media.imgName));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await this.prisma.media.delete({ where: { id } });
    return { message: 'Media deleted' };
  }

  /**
   * Creates a media from an uploaded file (buffer, name, alt)
   * Centralizes naming, storage, and DB creation logic
   */
  async createFromUpload(
    file: MulterFile,
    name?: string,
    alt?: string,
  ): Promise<Media> {
    const uploadPath = './uploads/media';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    const imgName = await generateUniqueMediaFileName(
      this.prisma,
      uploadPath,
      file,
      name,
    );
    const filePath = path.join(String(uploadPath), String(imgName));
    fs.writeFileSync(filePath, Buffer.from(file.buffer));
    const url = `/uploads/media/${imgName}`;
    const media = await this.create({
      name: name?.trim() ? name : file.originalname,
      imgName,
      alt: alt || 'profile image',
      url,
    });
    return media;
  }

  /**
   * Updates an existing media (replace file and/or fields)
   * - If the media is not linked to a user/resource, replaces the file and updates imgName, alt, name, url
   * - If the media is linked to a user, updates fields (except imgName/url if no new file)
   */
  async updateMediaWithFile(
    id: number,
    file: any,
    body: { name?: string; alt?: string },
  ): Promise<Media> {
    const media = await this.prisma.media.findUnique({ where: { id } });
    if (!media) throw new BadRequestException('Media not found');
    // Check if the media is attached to a user
    const userWithMedia = await this.prisma.user.findFirst({
      where: { mediaId: id },
    });
    let imgName = media.imgName;
    let url = media.url;
    // If a new file is uploaded and the media is not linked to a user
    if (file && !userWithMedia) {
      // Delete the old file
      const oldFilePath = path.join('uploads', 'media', String(media.imgName));
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Generate a new unique name
      imgName = await generateUniqueMediaFileName(
        this.prisma,
        './uploads/media',
        file,
        body.name,
      );
      const filePath = path.join('./uploads/media', String(imgName));
      fs.writeFileSync(filePath, Buffer.from(file.buffer));
      url = `/uploads/media/${imgName}`;
    }
    // Update fields
    const updated = await this.prisma.media.update({
      where: { id },
      data: {
        name: body.name?.trim() ? body.name : media.name,
        alt: body.alt ?? media.alt,
        imgName,
        url,
      },
    });
    return updated as Media;
  }

  /**
   * Checks if a media is used by another resource (user, application, dashboard, etc.)
   * Returns true if used elsewhere, false otherwise
   */
  async isMediaUsedElsewhere(
    mediaId: number,
    excludeUserId?: number,
    excludeApplicationId?: number,
  ): Promise<boolean> {
    // Check if another user uses this media
    const user = await this.prisma.user.findFirst({
      where: {
        mediaId,
        NOT: excludeUserId ? { id: excludeUserId } : undefined,
      },
    });
    if (user) return true;
    // Check if another application uses this media
    const application = await this.prisma.application.findFirst({
      where: {
        iconMediaId: mediaId,
        NOT: excludeApplicationId ? { id: excludeApplicationId } : undefined,
      },
    });
    if (application) return true;
    // TODO: Extend for dashboard, widgets, etc. if needed
    return false;
  }

  /**
   * Returns paginated media
   * @param page page number (default: 1)
   * @param limit number of items per page (default: 10)
   */
  async findAllPaginated(
    page = 1,
    limit = 10,
  ): Promise<{
    data: Media[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.media.findMany({ skip, take: limit }),
      this.prisma.media.count(),
    ]);
    return {
      data: data as Media[],
      total,
      page,
      limit,
    };
  }
}
