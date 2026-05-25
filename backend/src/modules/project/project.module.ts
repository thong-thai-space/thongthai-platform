import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectUseCases } from './use-cases/project.use-cases';
import { ProjectStatusPolicy } from './policies/project-status.policy';
import { ProjectNotificationAdapter } from './adapters/project-notification.adapter';
import {
  PROJECT_NOTIFICATION_PORT,
  PROJECT_REPOSITORY,
} from './project.constants';

// Pattern: Composition Root — ports bound to adapters here
@Module({
  imports: [NotificationModule],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    ProjectUseCases,
    ProjectRepository,
    ProjectNotificationAdapter,
    ProjectStatusPolicy,
    { provide: PROJECT_REPOSITORY, useExisting: ProjectRepository },
    {
      provide: PROJECT_NOTIFICATION_PORT,
      useExisting: ProjectNotificationAdapter,
    },
  ],
  exports: [ProjectService],
})
export class ProjectModule {}
