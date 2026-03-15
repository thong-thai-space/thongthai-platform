import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
  imports: [NotificationModule],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
