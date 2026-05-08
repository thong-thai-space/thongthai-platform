import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Project, ProjectStatus, Prisma } from '@prisma/client';

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
      throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find all projects with includes
   */
  async findAllWithIncludes(where?: Prisma.ProjectWhereInput, includeRelations: boolean = true): Promise<any[]> {
    try {
      return await this.prisma.project.findMany({
        where,
        include: includeRelations ? {
          client: { select: { id: true, name: true, email: true } },
          tasks: { select: { id: true, status: true } },
          _count: { select: { tasks: true, invoices: true } },
        } : undefined,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to fetch projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find project by ID
   */
  async findById(id: string): Promise<Project | null> {
    try {
      return await this.prisma.project.findUnique({ where: { id } });
    } catch (error) {
      throw new Error(`Failed to find project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find project by ID with full includes
   */
  async findByIdWithIncludes(id: string): Promise<any> {
    try {
      return await this.prisma.project.findUnique({
        where: { id },
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
    } catch (error) {
      throw new Error(`Failed to find project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create project
   */
  async create(data: Prisma.ProjectCreateInput): Promise<Project> {
    try {
      return await this.prisma.project.create({ data });
    } catch (error) {
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        throw new Error('Project not found');
      }
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find projects by client
   */
  async findByClient(clientId: string, withIncludes: boolean = true): Promise<any[]> {
    try {
      return await this.prisma.project.findMany({
        where: { clientId },
        include: withIncludes ? { tasks: { select: { id: true, status: true } } } : undefined,
        orderBy: { updatedAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to find client projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      throw new Error(`Failed to find projects by status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find showcase projects
   */
  async findShowcase(): Promise<any[]> {
    try {
      return await this.prisma.project.findMany({
        where: { isShowcase: true },
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
        orderBy: { showcaseOrder: 'asc' },
      });
    } catch (error) {
      throw new Error(`Failed to find showcase projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

