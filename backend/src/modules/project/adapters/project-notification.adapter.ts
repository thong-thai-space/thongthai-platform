import { Inject, Injectable } from '@nestjs/common';
import { NotificationType, type Project } from '@prisma/client';
import { NotificationService } from '../../notification/notification.service';
import { PROJECT_REPOSITORY } from '../project.constants';
import type { ProjectNotificationPort } from '../domain/project.notification.port';
import type { ProjectRepositoryPort } from '../domain/project.repository.port';

// Pattern: Adapter — fulfils the ProjectNotificationPort using NotificationService
@Injectable()
export class ProjectNotificationAdapter implements ProjectNotificationPort {
  constructor(
    private readonly notifications: NotificationService,
    @Inject(PROJECT_REPOSITORY)
    private readonly repo: ProjectRepositoryPort,
  ) {}

  async notifyProjectCreated(
    project: Project,
    creatorId: string,
    clientId?: string,
  ): Promise<void> {
    const adminIds = await this.repo.findActiveAdminIds(creatorId);
    await Promise.all(
      adminIds.map((adminId) =>
        this.notifications.create({
          type: NotificationType.PROJECT_UPDATE,
          title: 'New project created',
          message: `Project "${project.name}" has been created.`,
          userId: adminId,
          data: { projectId: project.id },
        }),
      ),
    );

    if (clientId) {
      await this.notifications.create({
        type: NotificationType.PROJECT_UPDATE,
        title: 'New project assigned',
        message: `Project "${project.name}" has been created for you.`,
        userId: clientId,
        data: { projectId: project.id },
      });
    }
  }

  async notifyProjectRequested(
    project: Project,
    clientId: string,
  ): Promise<void> {
    const [adminIds, clientName] = await Promise.all([
      this.repo.findActiveAdminIds(),
      this.repo.findUserNameById(clientId),
    ]);

    await Promise.all(
      adminIds.map((adminId) =>
        this.notifications.create({
          type: NotificationType.PROJECT_REQUEST,
          title: 'New project request',
          message: `Client ${clientName ?? 'N/A'} submitted a project request: ${project.name}`,
          userId: adminId,
          data: { projectId: project.id, clientId },
        }),
      ),
    );
  }

  async notifyRequestAccepted(project: Project): Promise<void> {
    if (!project.clientId) return;
    await this.notifications.create({
      type: NotificationType.PROJECT_UPDATE,
      title: 'Project request accepted',
      message: `Project "${project.name}" has been accepted by Thong Thai Space and is now in progress.`,
      userId: project.clientId,
      data: { projectId: project.id },
    });
  }
}
