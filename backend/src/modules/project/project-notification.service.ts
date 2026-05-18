import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { ProjectRepository } from './repositories/project.repository';
import type { Project } from '@prisma/client';

@Injectable()
export class ProjectNotificationService {
  constructor(
    private notificationService: NotificationService,
    private projectRepository: ProjectRepository,
  ) {}

  async notifyProjectCreated(project: Project, creatorId: string, clientId?: string) {
    const adminIds = await this.projectRepository.findActiveAdminIds(creatorId);

    for (const adminId of adminIds) {
      await this.notificationService.create({
        type: NotificationType.PROJECT_UPDATE,
        title: 'New project created',
        message: `Project "${project.name}" has been created.`,
        userId: adminId,
        data: { projectId: project.id },
      });
    }

    if (clientId) {
      await this.notificationService.create({
        type: NotificationType.PROJECT_UPDATE,
        title: 'New project assigned',
        message: `Project "${project.name}" has been created for you.`,
        userId: clientId,
        data: { projectId: project.id },
      });
    }
  }

  async notifyProjectRequested(project: Project, clientId: string) {
    const adminIds = await this.projectRepository.findActiveAdminIds();
    const clientName = await this.projectRepository.findUserNameById(clientId);

    for (const adminId of adminIds) {
      await this.notificationService.create({
        type: NotificationType.PROJECT_REQUEST,
        title: 'New project request',
        message: `Client ${clientName || 'N/A'} submitted a project request: ${project.name}`,
        userId: adminId,
        data: { projectId: project.id, clientId },
      });
    }
  }

  async notifyRequestAccepted(project: Project) {
    if (!project.clientId) return;

    await this.notificationService.create({
      type: NotificationType.PROJECT_UPDATE,
      title: 'Project request accepted',
      message: `Project "${project.name}" has been accepted by Thong Thai Space and is now in progress.`,
      userId: project.clientId,
      data: { projectId: project.id },
    });
  }
}
