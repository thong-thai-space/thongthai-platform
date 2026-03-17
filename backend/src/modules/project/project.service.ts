import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { UserRole, NotificationType } from '@prisma/client';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { CreateProjectRequestDto } from './dto/create-project-request.dto';
import { UpdateProjectClientDto } from './dto/update-project-client.dto';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async findAll(userId: string, role: UserRole) {
    if (role === UserRole.CLIENT) {
      return this.prisma.project.findMany({
        where: { clientId: userId },
        include: { tasks: { select: { id: true, status: true } } },
        orderBy: { updatedAt: 'desc' },
      });
    }

    // MEMBER: only see projects where they have assigned tasks
    if (role === UserRole.MEMBER) {
      return this.prisma.project.findMany({
        where: {
          tasks: { some: { assigneeId: userId } },
        },
        include: {
          client: { select: { id: true, name: true, email: true } },
          tasks: { select: { id: true, status: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    }

    return this.prisma.project.findMany({
      include: {
        client: { select: { id: true, name: true, email: true } },
        tasks: { select: { id: true, status: true } },
        _count: { select: { tasks: true, invoices: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string, role: UserRole) {
    const project = await this.prisma.project.findUnique({
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

    if (!project) throw new NotFoundException('Project not found');

    if (role === UserRole.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException();
    }

    // MEMBER: can only view projects where they have assigned tasks
    if (role === UserRole.MEMBER) {
      const hasAssignedTask = project.tasks.some((t) => t.assignee?.id === userId);
      if (!hasAssignedTask) throw new ForbiddenException();
    }

    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const { startDate, endDate, deadline, ...rest } = dto;
    const project = await this.prisma.project.create({
      data: {
        ...rest,
        ownerId: userId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
      },
    });

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

    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        budget: dto.budget,
        currency: dto.currency,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        techStack: dto.techStack || [],
        status: 'DRAFT',
        ownerId: clientId,
        clientId: clientId,
      },
    });

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

    return this.prisma.project.update({
      where: { id },
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        deadline: deadline ? new Date(deadline) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  async acceptRequest(projectId: string, adminUserId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true, status: true, clientId: true },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.status !== 'DRAFT' || !project.clientId) {
      throw new BadRequestException('This project is not a client request');
    }

    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ownerId: adminUserId,
        status: 'IN_PROGRESS',
      },
    });

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
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, clientId: true, status: true },
    });

    if (!project) throw new NotFoundException('Project not found');
    if (project.clientId !== clientId) throw new ForbiddenException();
    if (project.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT projects can be edited');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: dto.name,
        description: dto.description,
        budget: dto.budget,
        currency: dto.currency,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        techStack: dto.techStack,
      },
    });
  }

  async getShowcase() {
    return this.prisma.project.findMany({
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
  }
}
