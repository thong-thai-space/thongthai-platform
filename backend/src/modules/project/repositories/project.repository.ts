import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Project, ProjectStatus, Prisma, UserRole } from '@prisma/client';

const projectListIncludes = Prisma.validator<Prisma.ProjectDefaultArgs>()({
  include: {
    client: { select: { id: true, name: true, email: true } },
    tasks: { select: { id: true, status: true } },
    _count: { select: { tasks: true, invoices: true } },
  },
});

const projectDetailsIncludes = Prisma.validator<Prisma.ProjectDefaultArgs>()({
  include: {
    owner: { select: { id: true, name: true, email: true } },
    client: { select: { id: true, name: true, email: true } },
    tasks: {
      orderBy: { order: 'asc' },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    },
    milestones: { orderBy: { dueDate: 'asc' } },
    invoices: true,
    files: true,
  },
});

const projectShowcaseSelect = Prisma.validator<Prisma.ProjectDefaultArgs>()({
  select: {
    id: true,
    name: true,
    description: true,
    techStack: true,
    liveUrl: true,
    thumbnailUrl: true,
    screenshots: true,
    showcaseOrder: true,
  },
});

export type ProjectListWithIncludes = Prisma.ProjectGetPayload<
  typeof projectListIncludes
>;
export type ProjectWithIncludes = Prisma.ProjectGetPayload<
  typeof projectDetailsIncludes
>;
export type ProjectShowcase = Prisma.ProjectGetPayload<
  typeof projectShowcaseSelect
>;

/**
 * Pattern: Repository Pattern
 * Encapsulates all Project data access
 */
@Injectable()
export class ProjectRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all projects (with filtering)
   */
  async findAll(where?: Prisma.ProjectWhereInput): Promise<Project[]> {
    try {
      return await this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch projects');
    }
  }

  /**
   * Find all projects with includes
   */
  async findAllWithIncludes(where?: Prisma.ProjectWhereInput): Promise<ProjectListWithIncludes[]> {
    try {
      return await this.prisma.project.findMany({
        where,
        include: projectListIncludes.include,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch projects');
    }
  }

  /**
   * Find project by ID
   */
  async findById(id: string): Promise<Project | null> {
    try {
      return await this.prisma.project.findUnique({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find project');
    }
  }

  /**
   * Find project by ID with full includes
   */
  async findByIdWithIncludes(id: string): Promise<ProjectWithIncludes | null> {
    try {
      return await this.prisma.project.findUnique({
        where: { id },
        include: projectDetailsIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find project');
    }
  }

  /**
   * Create project
   */
  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    try {
      return await this.prisma.project.create({ data });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create project');
    }
  }

  /**
   * Update project
   */
  async update(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    try {
      return await this.prisma.project.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
      throw new InternalServerErrorException('Failed to update project');
    }
  }

  /**
   * Delete project
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.project.delete({ where: { id } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Project not found');
      }
      throw new InternalServerErrorException('Failed to delete project');
    }
  }

  /**
   * Find projects by client
   */
  async findByClient(clientId: string): Promise<ProjectListWithIncludes[]> {
    try {
      return await this.prisma.project.findMany({
        where: { clientId },
        include: projectListIncludes.include,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find client projects');
    }
  }

  /**
   * Find projects by status
   */
  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    try {
      return await this.prisma.project.findMany({
        where: { status },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find projects by status');
    }
  }

  /**
   * Find showcase projects
   */
  async findShowcase(): Promise<ProjectShowcase[]> {
    try {
      return await this.prisma.project.findMany({
        where: { isShowcase: true },
        select: projectShowcaseSelect.select,
        orderBy: { showcaseOrder: 'asc' },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to find showcase projects');
    }
  }

  async findActiveAdminIds(excludeUserId?: string): Promise<string[]> {
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

  async findUserNameById(userId: string): Promise<string | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      return user?.name || null;
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user');
    }
  }
}

