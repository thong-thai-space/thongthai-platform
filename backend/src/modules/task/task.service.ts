import { Injectable } from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { UserRole } from '@prisma/client';
import { TaskUseCases } from './use-cases/task.use-cases';

@Injectable()
export class TaskService {
  constructor(private taskUseCases: TaskUseCases) {}

  async findByProject(
    projectId: string | undefined,
    userId: string,
    role: UserRole,
  ) {
    return this.taskUseCases.findByProject(projectId, userId, role);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    return this.taskUseCases.findOne(id, userId, role);
  }

  async create(dto: CreateTaskDto, creatorId: string) {
    return this.taskUseCases.create(dto, creatorId);
  }

  async update(
    id: string,
    dto: UpdateTaskDto,
    updaterId?: string,
    updaterRole?: UserRole,
  ) {
    return this.taskUseCases.update(id, dto, updaterId, updaterRole);
  }

  async remove(id: string) {
    return this.taskUseCases.remove(id);
  }

  async getMyTasks(userId: string) {
    return this.taskUseCases.getMyTasks(userId);
  }

  async addComment(
    taskId: string,
    content: string,
    userId: string,
    role: UserRole,
  ) {
    return this.taskUseCases.addComment(taskId, content, userId, role);
  }
}
