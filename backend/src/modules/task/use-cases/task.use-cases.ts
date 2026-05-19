import { Inject, Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, UserRole } from '@prisma/client';
import { CreateTaskDto, UpdateTaskDto } from '../dto/task.dto';
import { TASK_NOTIFICATION_PORT, TASK_REPOSITORY } from '../task.constants';
import type { TaskNotificationPort } from '../domain/task.notification.port';
import type { TaskRepositoryPort } from '../domain/task.repository.port';

// Pattern: Use Case
@Injectable()
export class TaskUseCases {
  constructor(
    @Inject(TASK_REPOSITORY)
    private taskRepository: TaskRepositoryPort,
    @Inject(TASK_NOTIFICATION_PORT)
    private notificationPort: TaskNotificationPort,
  ) {}

  async findByProject(projectId: string | undefined, userId: string, role: UserRole) {
    if (role === UserRole.MEMBER) {
      return this.getMyTasks(userId);
    }

    if (role === UserRole.CLIENT) {
      const where: Prisma.TaskWhereInput = {
        ...(projectId ? { projectId } : {}),
        project: { clientId: userId },
      };
      return this.taskRepository.findAllWithIncludes(where);
    }

    const where: Prisma.TaskWhereInput | undefined = projectId ? { projectId } : undefined;
    return this.taskRepository.findAllWithIncludes(where);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const task = await this.taskRepository.findByIdWithIncludes(id);
    if (!task) throw new NotFoundException('Task not found');

    // Pattern: Authorization - Per-resource access control
    if (role === UserRole.MEMBER && task.assigneeId !== userId) {
      throw new ForbiddenException('You do not have permission to access this task');
    }

    if (role === UserRole.CLIENT && task.project?.clientId !== userId) {
      throw new ForbiddenException('You do not have permission to access this task');
    }

    return task;
  }

  async create(dto: CreateTaskDto, creatorId: string) {
    // Pattern: Validation - Prevent circular subtasks
    if (dto.parentId) {
      const isCircular = await this.taskRepository.isCircularSubtask(dto.projectId, dto.parentId);
      if (isCircular) {
        throw new BadRequestException('Cannot create circular subtask relationship');
      }
    }

    // Pattern: Validation - Verify assignee is project member
    if (dto.assigneeId) {
      const assignee = await this.taskRepository.findUserSummary(dto.assigneeId);

      if (!assignee) {
        throw new BadRequestException('Assignee user not found');
      }

      if (assignee.role === UserRole.CLIENT) {
        const clientId = await this.taskRepository.findProjectClientId(dto.projectId);
        if (clientId !== dto.assigneeId) {
          throw new BadRequestException('Assignee does not have access to this project');
        }
      }
    }

    const createData: Prisma.TaskCreateInput = {
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      estimatedHours: dto.estimatedHours,
      order: dto.order,
      ...(dto.assigneeId ? { assignee: { connect: { id: dto.assigneeId } } } : {}),
      ...(dto.parentId ? { parent: { connect: { id: dto.parentId } } } : {}),
      ...(dto.milestoneId ? { milestone: { connect: { id: dto.milestoneId } } } : {}),
      project: { connect: { id: dto.projectId } },
      creator: { connect: { id: creatorId } },
    };

    const task = await this.taskRepository.createWithIncludes(createData);

    if (dto.assigneeId && dto.assigneeId !== creatorId) {
      await this.notificationPort.create({
        type: NotificationType.TASK_ASSIGNED,
        title: 'New task assigned',
        message: `You have been assigned to "${task.title}" in project "${task.project?.name}".`,
        userId: dto.assigneeId,
        data: { taskId: task.id, projectId: task.projectId },
      });
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, updaterId?: string, updaterRole?: UserRole) {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new NotFoundException('Task not found');

    if (updaterRole === UserRole.MEMBER) {
      if (task.assigneeId !== updaterId) {
        throw new ForbiddenException('You can only update tasks assigned to you');
      }
    }

    const oldStatus = task.status;
    const updateData: Prisma.TaskUpdateInput = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null } : {}),
      ...(dto.estimatedHours !== undefined ? { estimatedHours: dto.estimatedHours } : {}),
      ...(dto.order !== undefined ? { order: dto.order } : {}),
      ...(dto.assigneeId !== undefined
        ? { assignee: dto.assigneeId ? { connect: { id: dto.assigneeId } } : { disconnect: true } }
        : {}),
    };

    const updated = await this.taskRepository.updateWithIncludes(id, updateData);

    if (dto.status && dto.status !== oldStatus && updaterId) {
      const updater = await this.taskRepository.findUserSummary(updaterId);
      const admins = await this.taskRepository.findAdminIds(updaterId);

      for (const adminId of admins) {
        await this.notificationPort.create({
          type: NotificationType.TASK_UPDATED,
          title: 'Task status updated',
          message: `${updater?.name || 'A member'} changed "${task.title}" from ${oldStatus} to ${dto.status}.`,
          userId: adminId,
          data: { taskId: task.id, projectId: task.projectId },
        });
      }
    }

    if (dto.assigneeId && dto.assigneeId !== task.assigneeId && dto.assigneeId !== updaterId) {
      const projectName = await this.taskRepository.findProjectName(task.projectId);

      await this.notificationPort.create({
        type: NotificationType.TASK_ASSIGNED,
        title: 'New task assigned',
        message: `You have been assigned to "${task.title}" in project "${projectName || ''}".`,
        userId: dto.assigneeId,
        data: { taskId: task.id, projectId: task.projectId },
      });
    }

    return updated;
  }

  async remove(id: string) {
    await this.taskRepository.delete(id);
    return { success: true };
  }

  async getMyTasks(userId: string) {
    return this.taskRepository.findByAssignee(userId);
  }

  async addComment(taskId: string, content: string, userId: string, role: UserRole) {
    const task = await this.findOne(taskId, userId, role);

    const comment = await this.taskRepository.createComment({
      content,
      authorId: userId,
      taskId,
    });

    const recipients = new Set<string>();

    const admins = await this.taskRepository.findAdminIds();
    for (const adminId of admins) recipients.add(adminId);

    const ownerId = await this.taskRepository.findProjectOwnerId(task.projectId);
    if (ownerId) recipients.add(ownerId);
    if (task.assigneeId) recipients.add(task.assigneeId);
    if (task.creatorId) recipients.add(task.creatorId);

    recipients.delete(userId);

    for (const recipientId of recipients) {
      await this.notificationPort.create({
        type: NotificationType.TASK_UPDATED,
        title: 'New task comment',
        message: `${comment.author?.name || 'A user'} commented on task "${task.title}".`,
        userId: recipientId,
        data: {
          taskId: task.id,
          projectId: task.projectId,
          commentId: comment.id,
        },
      });
    }

    return comment;
  }
}
