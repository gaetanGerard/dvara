import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateDashboardDto } from './dto/create-dashboard.dto';
import { UpdateDashboardDto } from './dto/update-dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDashboardDto: CreateDashboardDto, ownerId: number) {
    if (!ownerId || isNaN(ownerId)) {
      throw new Error('ownerId is missing or invalid');
    }
    // 1. Create all required settings sub-objects with default values
    const general = await this.prisma.dashboardSettingsGeneral.create({
      data: { pageTitle: createDashboardDto.name },
    });
    const layout = await this.prisma.dashboardSettingsLayout.create({
      data: {
        layouts: JSON.stringify([
          { name: 'default', breakpoint: 'lg', columns: 12 },
        ]),
      },
    });
    const background = await this.prisma.dashboardSettingsBackground.create({
      data: {
        position: 'FIXED',
        size: 'COVER',
        repeat: 'NO_REPEAT',
      },
    });
    const appearance = await this.prisma.dashboardSettingsAppearance.create({
      data: {
        mainColor: '#1976d2',
        secondaryColor: '#fff',
        iconColor: '#1976d2',
        borderRadius: 'M',
      },
    });
    const settings = await this.prisma.dashboardSettings.create({
      data: {
        generalId: general.id,
        layoutId: layout.id,
        backgroundId: background.id,
        appearanceId: appearance.id,
      },
    });
    // 2. Create empty content
    const content = await this.prisma.dashboardContent.create({ data: {} });
    // 3. Create the dashboard
    const dashboard = await this.prisma.dashboard.create({
      data: {
        name: createDashboardDto.name,
        public: createDashboardDto.public ?? false,
        ownerId,
        settingsId: settings.id,
        contentId: content.id,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            pseudo: true,
            mediaId: true,
            languageId: true,
            email: true,
          },
        },
        settings: {
          include: {
            general: true,
            layout: true,
            background: true,
            appearance: true,
          },
        },
        content: true,
      },
    });
    return dashboard;
  }

  findAll() {
    return `This action returns all dashboard`;
  }

  findOne(id: number) {
    return `This action returns a #${id} dashboard`;
  }

  update(id: number, _updateDashboardDto: UpdateDashboardDto) {
    return `This action updates a #${id} dashboard`;
  }

  remove(id: number) {
    return `This action removes a #${id} dashboard`;
  }
}
