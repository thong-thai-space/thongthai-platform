import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, Task, UserRole } from '@prisma/client';
import { TaskRepositoryPort } from '../domain/task.repository.port';
import {
  taskAssigneeIncludes,
  taskCommentIncludes,
  taskCreateIncludes,
  taskDetailIncludes,
  taskListIncludes,
  taskUpdateIncludes,
  TaskCommentWithAuthor,
  TaskListItem,
  TaskWithAssignee,
  TaskWithDetails,
  TaskWithProject,
  TaskWithProjectSummary,
} from '../domain/task.types';

/**
 * Pattern: Repository Pattern
 * Encapsulates all Task data access
 */
@Injectable()
export class TaskRepository implements TaskRepositoryPort {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all tasks (with filtering)
   */
  async findAll(where?: Prisma.TaskWhereInput): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch tasks');
    }
  }

  /**
   * Find all tasks with includes
   */
  async findAllWithIncludes(
    where?: Prisma.TaskWhereInput,
  ): Promise<TaskListItem[]> {
    try {
      return await this.prisma.task.findMany({
        where,
        include: taskListIncludes.include,
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch tasks');
    }
  }

  /**
   * Find task by ID
   */
  async findById(id: string): Promise<Task | null> {
    try {
      return await this.prisma.task.findUnique({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find task');
    }
  }

  /**
   * Find task by ID with full includes
   */
  async findByIdWithIncludes(id: string): Promise<TaskWithDetails | null> {
    try {
      return await this.prisma.task.findUnique({
        where: { id },
        include: taskDetailIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find task');
    }
  }

  /**
   * Create task
   */
  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    try {
      return await this.prisma.task.create({ data });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  /**
   * Update task
   */
  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    try {
      return await this.prisma.task.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Task not found');
      }
      throw new InternalServerErrorException('Failed to update task');
    }
  }

  /**
   * Delete task
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.task.delete({ where: { id } });
      return true;
    } catch (error) {
      throw new InternalServerErrorException('Failed to delete task');
    }
  }

  /**
   * Find tasks by project
   */
  async findByProject(projectId: string): Promise<Task[]> {
    try {
      return await this.prisma.task.findMany({
        where: { projectId },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find project tasks');
    }
  }

  /**
   * Find tasks assigned to user
   */
  async findByAssignee(userId: string): Promise<TaskWithProjectSummary[]> {
    try {
      return await this.prisma.task.findMany({
        where: { assigneeId: userId },
        include: taskAssigneeIncludes.include,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find assigned tasks');
    }
  }

  /**
   * Check if task can be circular
   */
  async isCircularSubtask(taskId: string, parentId: string): Promise<boolean> {
    try {
      // Check if parentId would create a circular reference
      let currentId: string | null = parentId;
      const visited = new Set<string>();

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        if (currentId === taskId) return true; // Circular!

        const parent: { parentId: string | null } | null =
          await this.prisma.task.findUnique({
            where: { id: currentId },
            select: { parentId: true },
          });

        currentId = parent?.parentId || null;
      }

      return false;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to check circular subtask',
      );
    }
  }

  /**
   * Create task with includes (for response)
   */
  async createWithIncludes(
    data: Prisma.TaskCreateInput,
  ): Promise<TaskWithProject> {
    try {
      return await this.prisma.task.create({
        data,
        include: taskCreateIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  /**
   * Update task with includes (for response)
   */
  async updateWithIncludes(
    id: string,
    data: Prisma.TaskUpdateInput,
  ): Promise<TaskWithAssignee> {
    try {
      return await this.prisma.task.update({
        where: { id },
        data,
        include: taskUpdateIncludes.include,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Task not found');
      }
      throw new InternalServerErrorException('Failed to update task');
    }
  }

  async findUserSummary(userId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }

  async findAdminIds(excludeUserId?: string): Promise<string[]> {
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: [UserRole.OWNER, UserRole.ADMIN] },
          isActive: true,
          ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        },
        select: { id: true },
      });

      return admins.map((admin) => admin.id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch admin users');
    }
  }

  async findProjectClientId(projectId: string): Promise<string | null> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { clientId: true },
      });
      return project?.clientId || null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch project client');
    }
  }

  async findProjectName(projectId: string): Promise<string | null> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { name: true },
      });
      return project?.name || null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch project');
    }
  }

  async findProjectOwnerId(projectId: string): Promise<string | null> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });
      return project?.ownerId || null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch project owner');
    }
  }

  async createComment(data: {
    content: string;
    authorId: string;
    taskId: string;
  }): Promise<TaskCommentWithAuthor> {
    try {
      return await this.prisma.comment.create({
        data: {
          content: data.content,
          authorId: data.authorId,
          taskId: data.taskId,
        },
        include: taskCommentIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create comment');
    }
  }
}
