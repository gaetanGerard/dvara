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

  // Create a new group
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req, @Body() createGroupDto: CreateGroupDto) {
    const user = req.user;
    if (!user?.groupIds?.length) throw new ForbiddenException('Access denied');
    return this.groupService.create(createGroupDto, user);
  }

  // List all groups accessible to the user
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req) {
    const user = req.user;
    return this.groupService.findAll(user);
  }

  // Get details of a group by id
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Req() req, @Param('id') id: string) {
    const user = req.user;
    return this.groupService.findOne(Number(id), user);
  }

  // Update a group
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

  // Delete a group
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Req() req, @Param('id') id: string) {
    const user = req.user;
    return this.groupService.remove(Number(id), user);
  }
}
