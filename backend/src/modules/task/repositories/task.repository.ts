import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Task, TaskStatus, Prisma } from '@prisma/client';

/**
 * Pattern: Repository Pattern
 * Encapsulates all Task data access
 */
@Injectable()
export class TaskRepository {
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
      throw new Error(`Failed to fetch tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all tasks with includes
   */
  async findAllWithIncludes(where?: Prisma.TaskWhereInput): Promise<any[]> {
    try {
      return await this.prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          project: { select: { id: true, name: true } },
          subTasks: { select: { id: true, title: true, status: true } },
          _count: { select: { comments: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      });
    } catch (error) {
      throw new Error(`Failed to fetch tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find task by ID
   */
  async findById(id: string): Promise<Task | null> {
    try {
      return await this.prisma.task.findUnique({ where: { id } });
    } catch (error) {
      throw new Error(`Failed to find task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find task by ID with full includes
   */
  async findByIdWithIncludes(id: string): Promise<any> {
    try {
      return await this.prisma.task.findUnique({
        where: { id },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true } },
          project: { select: { id: true, name: true, clientId: true } },
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
    } catch (error) {
      throw new Error(`Failed to find task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create task
   */
  async create(data: Prisma.TaskCreateInput): Promise<Task> {
    try {
      return await this.prisma.task.create({ data });
    } catch (error) {
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('Task not found');
      }
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to find project tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find tasks assigned to user
   */
  async findByAssignee(userId: string): Promise<any[]> {
    try {
      return await this.prisma.task.findMany({
        where: { assigneeId: userId },
        include: {
          project: { select: { id: true, name: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      });
    } catch (error) {
      throw new Error(`Failed to find assigned tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

        const parent: { parentId: string | null } | null = await this.prisma.task.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });

        currentId = parent?.parentId || null;
      }

      return false;
    } catch (error) {
      throw new Error(`Failed to check circular subtask: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create task with includes (for response)
   */
  async createWithIncludes(data: Prisma.TaskCreateInput): Promise<any> {
    try {
      return await this.prisma.task.create({
        data,
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          project: { select: { id: true, name: true } },
        },
      });
    } catch (error) {
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update task with includes (for response)
   */
  async updateWithIncludes(id: string, data: Prisma.TaskUpdateInput): Promise<any> {
    try {
      return await this.prisma.task.update({
        where: { id },
        data,
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('Task not found');
      }
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

