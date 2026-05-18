import { Prisma, Task, UserRole } from '@prisma/client';
import {
  TaskCommentWithAuthor,
  TaskListItem,
  TaskWithAssignee,
  TaskWithDetails,
  TaskWithProject,
  TaskWithProjectSummary,
} from './task.types';

// Pattern: Repository Port
export interface TaskRepositoryPort {
  findAllWithIncludes(where?: Prisma.TaskWhereInput): Promise<TaskListItem[]>;
  findById(id: string): Promise<Task | null>;
  findByIdWithIncludes(id: string): Promise<TaskWithDetails | null>;
  createWithIncludes(data: Prisma.TaskCreateInput): Promise<TaskWithProject>;
  updateWithIncludes(id: string, data: Prisma.TaskUpdateInput): Promise<TaskWithAssignee>;
  delete(id: string): Promise<boolean>;
  findByAssignee(userId: string): Promise<TaskWithProjectSummary[]>;
  isCircularSubtask(taskId: string, parentId: string): Promise<boolean>;
  findUserSummary(userId: string): Promise<{ id: string; name: string | null; role: UserRole } | null>;
  findAdminIds(excludeUserId?: string): Promise<string[]>;
  findProjectClientId(projectId: string): Promise<string | null>;
  findProjectName(projectId: string): Promise<string | null>;
  findProjectOwnerId(projectId: string): Promise<string | null>;
  createComment(data: { content: string; authorId: string; taskId: string }): Promise<TaskCommentWithAuthor>;
}
