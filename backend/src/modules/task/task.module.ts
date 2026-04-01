import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { NotificationModule } from '../notification/notification.module';
import { TaskRepository } from './repositories/task.repository';

@Module({
  imports: [NotificationModule],
  controllers: [TaskController],
  providers: [TaskService, TaskRepository],
  exports: [TaskService],
})
export class TaskModule {}
