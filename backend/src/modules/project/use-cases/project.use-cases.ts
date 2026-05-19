import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ProjectStatus,
  UserRole,
  type Project,
} from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from '../dto/project.dto';
import { CreateProjectRequestDto } from '../dto/create-project-request.dto';
import { UpdateProjectClientDto } from '../dto/update-project-client.dto';
import {
  PROJECT_NOTIFICATION_PORT,
  PROJECT_REPOSITORY,
} from '../project.constants';
import type { ProjectRepositoryPort } from '../domain/project.repository.port';
import type { ProjectNotificationPort } from '../domain/project.notification.port';
import { ProjectStatusPolicy } from '../policies/project-status.policy';

// Pattern: Use Case — owns project read/write business rules
@Injectable()
export class ProjectUseCases {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly repo: ProjectRepositoryPort,
    @Inject(PROJECT_NOTIFICATION_PORT)
    private readonly notifier: ProjectNotificationPort,
    private readonly statusPolicy: ProjectStatusPolicy,
  ) {}

  findAll(userId: string, role: UserRole) {
    if (role === UserRole.CLIENT) {
      return this.repo.findByClient(userId);
    }
    if (role === UserRole.MEMBER) {
      return this.repo.findAllWithIncludes({
        tasks: { some: { assigneeId: userId } },
      });
    }
    return this.repo.findAllWithIncludes({});
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const project = await this.repo.findByIdWithIncludes(id);
    if (!project) throw new NotFoundException('Project not found');

    if (role === UserRole.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException();
    }
    if (role === UserRole.MEMBER) {
      const hasAssignedTask = project.tasks.some((t) => t.assignee?.id === userId);
      if (!hasAssignedTask) throw new ForbiddenException();
    }
    return project;
  }

  async create(dto: CreateProjectDto, userId: string): Promise<Project> {
    const data: Prisma.ProjectCreateInput = {
      name: dto.name,
      description: dto.description,
      status: dto.status,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      budget: dto.budget,
      budgetUsd: dto.budgetUsd,
      currency: dto.currency,
      techStack: dto.techStack ?? [],
      repoUrl: dto.repoUrl,
      liveUrl: dto.liveUrl,
      figmaUrl: dto.figmaUrl,
      owner: { connect: { id: userId } },
      ...(dto.clientId ? { client: { connect: { id: dto.clientId } } } : {}),
    };

    const project = await this.repo.create(data);
    await this.notifier.notifyProjectCreated(project, userId, dto.clientId);
    return project;
  }

  async createRequest(dto: CreateProjectRequestDto, clientId: string): Promise<Project> {
    const data: Prisma.ProjectCreateInput = {
      name: dto.name,
      description: dto.description,
      budget: dto.budget,
      currency: dto.currency,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      techStack: dto.techStack ?? [],
      status: ProjectStatus.DRAFT,
      owner: { connect: { id: clientId } },
      client: { connect: { id: clientId } },
    };

    const project = await this.repo.create(data);
    await this.notifier.notifyProjectRequested(project, clientId);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Project not found');

    if (dto.status) {
      this.statusPolicy.assertTransition(
        existing.status as ProjectStatus,
        dto.status as ProjectStatus,
      );
    }

    const { startDate, endDate, deadline, ...rest } = dto;
    const data: Prisma.ProjectUpdateInput = {
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
    };

    return this.repo.update(id, data);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    await this.repo.delete(id);
    return { success: true };
  }

  async acceptRequest(projectId: string, adminUserId: string): Promise<Project> {
    const project = await this.repo.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.status !== ProjectStatus.DRAFT || !project.clientId) {
      throw new BadRequestException('This project is not a client request');
    }

    const updated = await this.repo.update(projectId, {
      owner: { connect: { id: adminUserId } },
      status: ProjectStatus.IN_PROGRESS,
    });

    await this.notifier.notifyRequestAccepted(project);
    return updated;
  }

  async updateByClient(
    projectId: string,
    clientId: string,
    dto: UpdateProjectClientDto,
  ): Promise<Project> {
    const project = await this.repo.findById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== clientId) throw new ForbiddenException();
    if (project.status !== ProjectStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT projects can be edited');
    }

    return this.repo.update(projectId, {
      name: dto.name,
      description: dto.description,
      budget: dto.budget,
      currency: dto.currency,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      techStack: dto.techStack,
    });
  }

  getShowcase() {
    return this.repo.findShowcase();
  }
}
