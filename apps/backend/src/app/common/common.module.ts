import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PermissionService } from './shared/permission.service';
import { PermissionGuard } from './shared/permission.guard';

@Global()
@Module({
  providers: [PrismaService, PermissionService, PermissionGuard],
  exports: [PrismaService, PermissionService, PermissionGuard],
})
export class CommonModule {}
