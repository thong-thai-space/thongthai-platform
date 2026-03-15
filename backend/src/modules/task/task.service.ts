import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { UserRole, NotificationType } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async findByProject(projectId: string | undefined, userId: string, role: UserRole) {
    if (role === UserRole.MEMBER) {
      return this.getMyTasks(userId);
    }

    if (role === UserRole.CLIENT) {
      return this.prisma.task.findMany({
        where: {
          ...(projectId ? { projectId } : {}),
          project: { clientId: userId },
        },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          project: { select: { id: true, name: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      });
    }

    return this.prisma.task.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
        subTasks: { select: { id: true, title: true, status: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        subTasks: true,
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        timeEntries: true,
        milestone: true,
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(dto: CreateTaskDto, creatorId: string) {
    const data: Record<string, unknown> = { ...dto, creatorId };
    if (dto.dueDate) {
      data.dueDate = new Date(dto.dueDate);
    }
    const task = await this.prisma.task.create({
      data: data as any,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Notify the assignee if one was set
    if (dto.assigneeId && dto.assigneeId !== creatorId) {
      await this.notificationService.create({
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
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        assigneeId: true,
        projectId: true,
        project: { select: { name: true, ownerId: true } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');

    // MEMBER can only update tasks assigned to them
    if (updaterRole === UserRole.MEMBER) {
      if (task.assigneeId !== updaterId) {
        throw new ForbiddenException('You can only update tasks assigned to you');
      }
    }

    const oldStatus = task.status;
    const updateData: Record<string, unknown> = { ...dto };
    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    const updated = await this.prisma.task.update({
      where: { id },
      data: updateData as any,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Notify on status change
    if (dto.status && dto.status !== oldStatus && updaterId) {
      const updater = await this.prisma.user.findUnique({
        where: { id: updaterId },
        select: { name: true },
      });

      // Notify project owner + admins about status change
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: [UserRole.OWNER, UserRole.ADMIN] },
          isActive: true,
          id: { not: updaterId },
        },
        select: { id: true },
      });

      for (const admin of admins) {
        await this.notificationService.create({
          type: NotificationType.TASK_UPDATED,
          title: 'Task status updated',
          message: `${updater?.name || 'A member'} changed "${task.title}" from ${oldStatus} to ${dto.status}.`,
          userId: admin.id,
          data: { taskId: task.id, projectId: task.projectId },
        });
      }
    }

    // Notify new assignee when task is reassigned
    if (dto.assigneeId && dto.assigneeId !== task.assigneeId && dto.assigneeId !== updaterId) {
      await this.notificationService.create({
        type: NotificationType.TASK_ASSIGNED,
        title: 'New task assigned',
        message: `You have been assigned to "${task.title}" in project "${task.project?.name}".`,
        userId: dto.assigneeId,
        data: { taskId: task.id, projectId: task.projectId },
      });
    }

    return updated;
  }

  async remove(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  async getMyTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { assigneeId: userId },
      include: {
        project: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
    });
  }

  async addComment(taskId: string, content: string, userId: string, role: UserRole) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        projectId: true,
        assigneeId: true,
        project: { select: { ownerId: true, clientId: true } },
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    if (role === UserRole.MEMBER && task.assigneeId !== userId) {
      throw new ForbiddenException('You can only comment on tasks assigned to you');
    }

    if (role === UserRole.CLIENT && task.project?.clientId !== userId) {
      throw new ForbiddenException('You can only comment on your project tasks');
    }

    return this.prisma.comment.create({
      data: {
        content,
        authorId: userId,
        taskId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });
  }
}
