import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole, ProjectStatus, Prisma } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { UpdateProjectClientDto } from './dto/update-project-client.dto';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectNotificationService } from './project-notification.service';

@Injectable()
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private projectNotificationService: ProjectNotificationService,
  ) {}

  async findAll(userId: string, role: UserRole) {
    if (role === UserRole.CLIENT) {
      return this.projectRepository.findByClient(userId);
    }

    // MEMBER: only see projects where they have assigned tasks
    if (role === UserRole.MEMBER) {
      const where: Prisma.ProjectWhereInput = {
        tasks: { some: { assigneeId: userId } },
      };
      return this.projectRepository.findAllWithIncludes(where);
    }

    return this.projectRepository.findAllWithIncludes({});
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const project = await this.projectRepository.findByIdWithIncludes(id);

    if (!project) throw new NotFoundException('Project not found');

    if (role === UserRole.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException();
    }

    // MEMBER: can only view projects where they have assigned tasks
    if (role === UserRole.MEMBER) {
      const hasAssignedTask = project.tasks.some((task) => task.assignee?.id === userId);
      if (!hasAssignedTask) throw new ForbiddenException();
    }

    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const createData: Prisma.ProjectCreateInput = {
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

    const project = await this.projectRepository.create(createData);

    await this.projectNotificationService.notifyProjectCreated(
      project,
      userId,
      dto.clientId,
    );

    return project;
  }

  async createRequest(dto: CreateProjectRequestDto, clientId: string) {
    const createData: Prisma.ProjectCreateInput = {
      name: dto.name,
      description: dto.description,
      budget: dto.budget,
      currency: dto.currency,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      techStack: dto.techStack || [],
      status: ProjectStatus.DRAFT,
      owner: { connect: { id: clientId } },
      client: { connect: { id: clientId } },
    };

    const project = await this.projectRepository.create(createData);

    await this.projectNotificationService.notifyProjectRequested(project, clientId);

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const { startDate, endDate, deadline, ...rest } = dto;

    const existingProject = await this.projectRepository.findById(id);

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    // Pattern: State Machine - Validate project status transitions
    if (dto.status && dto.status !== existingProject.status) {
      this.validateProjectStatusTransition(
        existingProject.status as ProjectStatus,
        dto.status as ProjectStatus,
      );
    }

    const updateData: Prisma.ProjectUpdateInput = {
      ...rest,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
    };

    return this.projectRepository.update(id, updateData);
  }

  private validateProjectStatusTransition(
    currentStatus: ProjectStatus,
    newStatus: ProjectStatus,
  ): void {
    // Pattern: State Machine - Define valid project status transitions
    const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      DRAFT: ['PROPOSAL_SENT', 'CANCELLED'],
      PROPOSAL_SENT: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['ON_HOLD', 'REVIEW', 'CANCELLED'],
      ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
      REVIEW: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      COMPLETED: [], // Terminal state
      CANCELLED: [], // Terminal state
    };

    const allowedNextStates = validTransitions[currentStatus];
    if (!allowedNextStates.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}. Allowed transitions: ${allowedNextStates.join(', ') || 'none'}`,
      );
    }
  }

  async remove(id: string) {
    await this.projectRepository.delete(id);
    return { success: true };
  }

  async acceptRequest(projectId: string, adminUserId: string) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) throw new NotFoundException('Project not found');
    if (project.status !== 'DRAFT' || !project.clientId) {
      throw new BadRequestException('This project is not a client request');
    }

    const updated = await this.projectRepository.update(projectId, {
      owner: { connect: { id: adminUserId } },
      status: ProjectStatus.IN_PROGRESS,
    });

    await this.projectNotificationService.notifyRequestAccepted(project);

    return updated;
  }

  async updateByClient(projectId: string, clientId: string, dto: UpdateProjectClientDto) {
    const project = await this.projectRepository.findById(projectId);

    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== clientId) throw new ForbiddenException();
    if (project.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT projects can be edited');
    }

    const updateData: Prisma.ProjectUpdateInput = {
      name: dto.name,
      description: dto.description,
      budget: dto.budget,
      currency: dto.currency,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      techStack: dto.techStack,
    };

    return this.projectRepository.update(projectId, updateData);
  }

  async getShowcase() {
    return this.projectRepository.findShowcase();
  }
}
