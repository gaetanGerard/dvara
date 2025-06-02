import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { GroupModule } from './modules/group/group.module';

@Module({
  imports: [CommonModule, UsersModule, AuthModule, GroupModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
