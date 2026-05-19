import type { Prisma, Project } from '@prisma/client';
import type {
  ProjectListWithIncludes,
  ProjectShowcase,
  ProjectWithIncludes,
} from '../repositories/project.repository';

// Pattern: Repository Port — persistence boundary for the project module
export interface ProjectRepositoryPort {
  findAllWithIncludes(where?: Prisma.ProjectWhereInput): Promise<ProjectListWithIncludes[]>;
  findByIdWithIncludes(id: string): Promise<ProjectWithIncludes | null>;
  findById(id: string): Promise<Project | null>;
  findByClient(clientId: string): Promise<ProjectListWithIncludes[]>;
  findShowcase(): Promise<ProjectShowcase[]>;
  create(data: Prisma.ProjectCreateInput): Promise<Project>;
  update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project>;
  delete(id: string): Promise<boolean>;
  findActiveAdminIds(excludeUserId?: string): Promise<string[]>;
  findUserNameById(userId: string): Promise<string | null>;
}
