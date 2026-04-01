import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { UserRole, NotificationType, ProjectStatus, Prisma } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { UpdateProjectClientDto } from './dto/update-project-client.dto';
import { ProjectRepository } from './repositories/project.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectService {
  constructor(
    private projectRepository: ProjectRepository,
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async findAll(userId: string, role: UserRole) {
    if (role === UserRole.CLIENT) {
      return this.projectRepository.findByClient(userId, true);
    }

    // MEMBER: only see projects where they have assigned tasks
    if (role === UserRole.MEMBER) {
      const where: Prisma.ProjectWhereInput = {
        tasks: { some: { assigneeId: userId } },
      };
      return this.projectRepository.findAllWithIncludes(where, true);
    }

    return this.projectRepository.findAllWithIncludes({}, true);
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const project = await this.projectRepository.findByIdWithIncludes(id);

    if (!project) throw new NotFoundException('Project not found');

    if (role === UserRole.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException();
    }

    // MEMBER: can only view projects where they have assigned tasks
    if (role === UserRole.MEMBER) {
      const hasAssignedTask = project.tasks.some((t: any) => t.assignee?.id === userId);
      if (!hasAssignedTask) throw new ForbiddenException();
    }

    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const { startDate, endDate, deadline, ...rest } = dto;
    const createData: Prisma.ProjectCreateInput = {
      ...rest,
      ownerId: userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
    } as any;

    const project = await this.projectRepository.create(createData);

    // Notify OWNER and ADMIN users about new project
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.OWNER, UserRole.ADMIN] },
        isActive: true,
        id: { not: userId },
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationService.create({
        type: NotificationType.PROJECT_UPDATE,
        title: 'New project created',
        message: `Project "${project.name}" has been created.`,
        userId: admin.id,
        data: { projectId: project.id },
      });
    }

    // If a client is assigned, notify them
    if (dto.clientId) {
      await this.notificationService.create({
        type: NotificationType.PROJECT_UPDATE,
        title: 'New project assigned',
        message: `Project "${project.name}" has been created for you.`,
        userId: dto.clientId,
        data: { projectId: project.id },
      });
    }

    return project;
  }

  async createRequest(dto: CreateProjectRequestDto, clientId: string) {
    const client = await this.prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true },
    });

    const createData: Prisma.ProjectCreateInput = {
      name: dto.name,
      description: dto.description,
      budget: dto.budget,
      currency: dto.currency,
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      techStack: dto.techStack || [],
      status: 'DRAFT',
      owner: { connect: { id: clientId } },
      client: { connect: { id: clientId } },
    } as any;

    const project = await this.projectRepository.create(createData);

    // Notify all OWNER and ADMIN users about the client request
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.OWNER, UserRole.ADMIN] },
        isActive: true,
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationService.create({
        type: NotificationType.PROJECT_REQUEST,
        title: 'New project request',
        message: `Client ${client?.name || 'N/A'} submitted a project request: ${dto.name}`,
        userId: admin.id,
        data: { projectId: project.id, clientId },
      });
    }

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
      status: 'IN_PROGRESS',
    } as any);

    // Notify the client that their request was accepted
    await this.notificationService.create({
      type: NotificationType.PROJECT_UPDATE,
      title: 'Project request accepted',
      message: `Project "${project.name}" has been accepted by Thong Thai Space and is now in progress.`,
      userId: project.clientId,
      data: { projectId: project.id },
    });

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
