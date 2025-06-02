import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req, @Body() createGroupDto: CreateGroupDto) {
    const user = req.user;
    // Vérification super_admin (doit avoir l'id du groupe super_admin dans groupIds)
    if (!user?.groupIds?.length) throw new ForbiddenException('Accès refusé');
    // On récupère l'id du groupe super_admin (hardcodé ou via enum)
    // Ici, on suppose que le service saura vérifier la présence du super_admin
    return this.groupService.create(createGroupDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req) {
    const user = req.user;
    return this.groupService.findAll(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    const user = req.user;
    return this.groupService.findOne(Number(id), user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Req() req,
    @Param('id') id: string,
    @Body()
    updateGroupDto: {
      userIds?: number[];
      adminIds?: number[];
      permissions?: any;
      settings?: any;
    },
  ) {
    const user = req.user;
    return this.groupService.update(Number(id), updateGroupDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const user = req.user;
    return this.groupService.remove(Number(id), user);
  }
}
