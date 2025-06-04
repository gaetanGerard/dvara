import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../../common/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { MediaService } from '../media/media.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [forwardRef(() => AuthModule), MediaModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, AuthService, MediaService],
  exports: [UsersService],
})
export class UsersModule {}
