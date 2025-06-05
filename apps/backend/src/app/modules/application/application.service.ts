import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { MediaService } from '../media/media.service';

@Injectable()
export class ApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mediaService: MediaService,
  ) {}

  async create(createApplicationDto: CreateApplicationDto) {
    if (!createApplicationDto.iconMediaId) {
      throw new BadRequestException(
        'An image (iconMediaId) is required to create an application.',
      );
    }
    return this.prisma.application.create({ data: createApplicationDto });
  }

  async findAll() {
    const apps = await this.prisma.application.findMany({
      include: { iconMedia: true },
    });
    if (!apps || apps.length === 0) {
      return { message: 'No applications found', data: [] };
    }
    return apps;
  }

  async findOne(id: number) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: { iconMedia: true },
    });
    if (!app) {
      throw new BadRequestException('Application not found');
    }
    return app;
  }

  async update(id: number, updateApplicationDto: UpdateApplicationDto) {
    if (
      Object.prototype.hasOwnProperty.call(
        updateApplicationDto,
        'iconMediaId',
      ) &&
      (updateApplicationDto.iconMediaId === null ||
        updateApplicationDto.iconMediaId === undefined)
    ) {
      throw new BadRequestException(
        'An image (iconMediaId) is required to update an application.',
      );
    }
    await this.prisma.application.update({
      where: { id },
      data: updateApplicationDto,
    });
    return this.findOne(id);
  }

  // Factorisation : méthode privée pour DRY
  private async getOrThrow(id: number) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: { iconMedia: true },
    });
    if (!app) throw new BadRequestException('Application not found');
    return app;
  }

  async remove(id: number) {
    const app = await this.getOrThrow(id);
    const iconMediaId = app.iconMediaId;
    await this.prisma.application.delete({ where: { id } });
    const usedElsewhere = await this.prisma.application.findFirst({
      where: { iconMediaId },
    });
    if (!usedElsewhere && iconMediaId) {
      await this.mediaService.remove(iconMediaId);
    }
    return { message: 'Application and associated media deleted if unused.' };
  }

  async setApplicationMedia(
    id: number,
    body: {
      mediaId?: number | null;
      deleteMedia?: boolean;
      name?: string;
      alt?: string;
    },
    file?: any,
  ) {
    const app = await this.getOrThrow(id);
    // Case 1: deletion/dissociation forbidden
    if (body.mediaId === null && body.deleteMedia) {
      throw new BadRequestException(
        'An application must always have an image.',
      );
    }
    // Case 2: upload a new file
    if (file) {
      return this.#handleMediaUpload(id, app, file, body);
    }
    // Case 3: associate an existing media
    if (body.mediaId) {
      await this.prisma.application.update({
        where: { id },
        data: { iconMediaId: body.mediaId },
      });
      return this.findOne(id);
    }
    // Case 4: simple dissociation (forbidden)
    if (body.mediaId === null) {
      throw new BadRequestException(
        'An application must always have an image.',
      );
    }
    throw new BadRequestException('No valid action for application media.');
  }

  // Extracted logic for upload/switch media
  async #handleMediaUpload(id: number, app: any, file: any, body: any) {
    const name =
      body.name && body.name.trim()
        ? String(body.name)
        : String(file.originalname);
    const alt = body.alt ? String(body.alt) : 'application icon';
    const oldMediaId = app.iconMedia?.id;
    const media = await this.mediaService.createFromUpload(file, name, alt);
    await this.prisma.application.update({
      where: { id },
      data: { iconMediaId: media.id },
    });
    if (oldMediaId && oldMediaId !== media.id) {
      await this.mediaService.remove(Number(oldMediaId));
    }
    return this.findOne(id);
  }
}
