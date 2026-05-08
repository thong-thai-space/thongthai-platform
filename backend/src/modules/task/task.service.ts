import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { UserRole, NotificationType, Prisma } from '@prisma/client';
import { TaskRepository } from './repositories/task.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TaskService {
  constructor(
    private taskRepository: TaskRepository,
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async findByProject(
    projectId: string | undefined,
    userId: string,
    role: UserRole,
  ) {
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

    const where: Prisma.TaskWhereInput | undefined = projectId
      ? { projectId }
      : undefined;
    return this.taskRepository.findAllWithIncludes(where);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const task = await this.taskRepository.findByIdWithIncludes(id);
    if (!task) throw new NotFoundException('Task not found');

    // Pattern: Authorization - Per-resource access control
    // OWNER/ADMIN can access any task; MEMBER can access tasks from their projects; CLIENT can access tasks from their projects
    if (role === UserRole.MEMBER && task.assigneeId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this task',
      );
    }

    if (role === UserRole.CLIENT && task.project.clientId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this task',
      );
    }

    return task;
  }

  async create(dto: CreateTaskDto, creatorId: string) {
    // Pattern: Validation - Prevent circular subtasks
    if (dto.parentId) {
      const isCircular = await this.taskRepository.isCircularSubtask(
        dto.projectId,
        dto.parentId,
      );
      if (isCircular) {
        throw new BadRequestException(
          'Cannot create circular subtask relationship',
        );
      }
    }

    // Pattern: Validation - Verify assignee is project member
    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: dto.assigneeId },
        select: { id: true, role: true },
      });

      if (!assignee) {
        throw new Error('Assignee user not found');
      }

      // Verify assignee has access to this project
      if (assignee.role === UserRole.CLIENT) {
        const clientProject = await this.prisma.project.findUnique({
          where: { id: dto.projectId },
          select: { clientId: true },
        });
        if (clientProject?.clientId !== dto.assigneeId) {
          throw new BadRequestException(
            'Assignee does not have access to this project',
          );
        }
      } else if (
        [UserRole.MEMBER, UserRole.OWNER, UserRole.ADMIN].includes(
          assignee.role,
        )
      ) {
        // MEMBER/OWNER/ADMIN are allowed (they have system-wide project access)
        // Additional permission checks can be added per org structure
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
      ...(dto.assigneeId
        ? { assignee: { connect: { id: dto.assigneeId } } }
        : {}),
      ...(dto.parentId ? { parent: { connect: { id: dto.parentId } } } : {}),
      ...(dto.milestoneId
        ? { milestone: { connect: { id: dto.milestoneId } } }
        : {}),
      project: { connect: { id: dto.projectId } },
      creator: { connect: { id: creatorId } },
    };

    const task = await this.taskRepository.createWithIncludes(createData);

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

  async update(
    id: string,
    dto: UpdateTaskDto,
    updaterId?: string,
    updaterRole?: UserRole,
  ) {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new NotFoundException('Task not found');

    // MEMBER can only update tasks assigned to them
    if (updaterRole === UserRole.MEMBER) {
      if (task.assigneeId !== updaterId) {
        throw new ForbiddenException(
          'You can only update tasks assigned to you',
        );
      }
    }

    const oldStatus = task.status;
    const updateData: Prisma.TaskUpdateInput = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.dueDate !== undefined
        ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
        : {}),
      ...(dto.estimatedHours !== undefined
        ? { estimatedHours: dto.estimatedHours }
        : {}),
      ...(dto.order !== undefined ? { order: dto.order } : {}),
      ...(dto.assigneeId !== undefined
        ? {
            assignee: dto.assigneeId
              ? { connect: { id: dto.assigneeId } }
              : { disconnect: true },
          }
        : {}),
    };

    const updated = await this.taskRepository.updateWithIncludes(
      id,
      updateData,
    );

    // Get full task details for notification
    const fullTask = await this.taskRepository.findById(id);

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
    if (
      dto.assigneeId &&
      dto.assigneeId !== task.assigneeId &&
      dto.assigneeId !== updaterId
    ) {
      const projectInfo = await this.prisma.project.findUnique({
        where: { id: task.projectId },
        select: { name: true },
      });

      await this.notificationService.create({
        type: NotificationType.TASK_ASSIGNED,
        title: 'New task assigned',
        message: `You have been assigned to "${task.title}" in project "${projectInfo?.name}".`,
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

  async addComment(
    taskId: string,
    content: string,
    userId: string,
    role: UserRole,
  ) {
    const task = await this.taskRepository.findById(taskId);

    if (!task) throw new NotFoundException('Task not found');

    // Get full task details for access control
    const fullTask = await this.findOne(taskId, userId, role);

    const comment = await this.prisma.comment.create({
      data: {
        content,
        authorId: userId,
        taskId,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Notify admins and other relevant users about the new task comment.
    const recipients = new Set<string>();

    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.OWNER, UserRole.ADMIN] },
        isActive: true,
      },
      select: { id: true },
    });

    for (const admin of admins) recipients.add(admin.id);

    const projectDetails = await this.prisma.project.findUnique({
      where: { id: task.projectId },
      select: { ownerId: true },
    });
    if (projectDetails?.ownerId) recipients.add(projectDetails.ownerId);
    if (task.assigneeId) recipients.add(task.assigneeId);

    const taskCreator = await this.taskRepository.findById(taskId);
    if (taskCreator) recipients.add(taskCreator.creatorId);

    recipients.delete(userId);

    for (const recipientId of recipients) {
      await this.notificationService.create({
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
