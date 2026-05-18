import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectNotificationService } from './project-notification.service';

@Module({
  imports: [NotificationModule],
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRepository, ProjectNotificationService],
  exports: [ProjectService],
})
export class ProjectModule {}
