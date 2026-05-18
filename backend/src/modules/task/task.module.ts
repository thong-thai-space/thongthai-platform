import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { NotificationModule } from '../notification/notification.module';
import { TaskRepository } from './repositories/task.repository';
import { TaskUseCases } from './use-cases/task.use-cases';
import { TaskNotificationAdapter } from './adapters/task-notification.adapter';
import { TASK_NOTIFICATION_PORT, TASK_REPOSITORY } from './task.constants';

@Module({
  imports: [NotificationModule],
  controllers: [TaskController],
  providers: [
    TaskService,
    TaskUseCases,
    TaskRepository,
    TaskNotificationAdapter,
    { provide: TASK_REPOSITORY, useExisting: TaskRepository },
    { provide: TASK_NOTIFICATION_PORT, useExisting: TaskNotificationAdapter },
  ],
  exports: [TaskService],
})
export class TaskModule {}
