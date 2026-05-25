import { Inject, Injectable } from '@nestjs/common';
import { CreateMessageDto } from '../dto/message.dto';
import {
  MESSAGE_NOTIFIER,
  MESSAGE_REALTIME,
  MESSAGE_REPOSITORY,
} from '../message.constants';
import type { MessageRepositoryPort } from '../domain/message.repository.port';
import type { MessageNotifierPort } from '../domain/message.notifier.port';
import type { MessageRealtimePort } from '../domain/message.realtime.port';
import { MessageAccessPolicy } from '../policies/message-access.policy';

// Pattern: Use Case — owns the messaging business rules
@Injectable()
export class MessageUseCases {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly repo: MessageRepositoryPort,
    @Inject(MESSAGE_NOTIFIER)
    private readonly notifier: MessageNotifierPort,
    @Inject(MESSAGE_REALTIME)
    private readonly realtime: MessageRealtimePort,
    private readonly accessPolicy: MessageAccessPolicy,
  ) {}

  async create(senderId: string, dto: CreateMessageDto) {
    const message = await this.repo.createMessage({
      content: dto.content,
      senderId,
      receiverId: dto.receiverId,
      ...(dto.projectId ? { projectId: dto.projectId } : {}),
    });

    this.realtime.pushNewMessage(dto.receiverId, message);
    await this.fanoutNotifications(senderId, dto, message.id);
    return message;
  }

  private async fanoutNotifications(
    senderId: string,
    dto: CreateMessageDto,
    messageId: string,
  ): Promise<void> {
    const recipients = await this.resolveRecipients(senderId, dto);
    if (recipients.size === 0) return;

    const sender = await this.repo.findUserName(senderId);
    const projectName = dto.projectId
      ? ((await this.repo.findProjectName(dto.projectId))?.name ?? '')
      : '';

    const body = projectName
      ? `${sender?.name ?? 'Someone'} sent a message in project "${projectName}".`
      : `${sender?.name ?? 'Someone'} sent you a message.`;

    await Promise.all(
      Array.from(recipients).map((recipientId) =>
        this.notifier.notifyNewMessage({
          recipientId,
          title: 'New message',
          body,
          metadata: { senderId, messageId, projectId: dto.projectId ?? null },
        }),
      ),
    );
  }

  private async resolveRecipients(
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<Set<string>> {
    const recipients = new Set<string>();

    if (dto.receiverId && dto.receiverId !== senderId) {
      recipients.add(dto.receiverId);
    }

    if (dto.projectId) {
      const project = await this.repo.findProjectParticipants(dto.projectId);
      if (project?.ownerId) recipients.add(project.ownerId);
      if (project?.clientId) recipients.add(project.clientId);
      for (const task of project?.tasks ?? []) {
        if (task.assigneeId) recipients.add(task.assigneeId);
      }
      const admins = await this.repo.findAdminIds();
      for (const admin of admins) recipients.add(admin.id);
    }

    recipients.delete(senderId);
    return recipients;
  }

  async findConversations(userId: string) {
    const [sent, received] = await Promise.all([
      this.repo.findDistinctSentReceivers(userId),
      this.repo.findDistinctReceivedSenders(userId),
    ]);

    const otherUserIds = Array.from(
      new Set([
        ...sent
          .map((m) => m.receiverId)
          .filter((id): id is string => Boolean(id)),
        ...received.map((m) => m.senderId).filter(Boolean),
      ]),
    );

    const conversations = await Promise.all(
      otherUserIds.map(async (otherUserId) => {
        const [otherUser, lastMessage, unreadCount] = await Promise.all([
          this.repo.findUserSummary(otherUserId),
          this.repo.findLastMessageBetween(userId, otherUserId),
          this.repo.countUnreadFromUser(otherUserId, userId),
        ]);
        return {
          userId: otherUserId,
          user: otherUser,
          lastMessage,
          unreadCount,
        };
      }),
    );

    return conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.getTime() ?? 0;
      const bTime = b.lastMessage?.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    });
  }

  findConversation(userId: string, otherUserId: string) {
    return this.repo.findConversationMessages(userId, otherUserId);
  }

  async findProjectConversation(projectId: string, userId: string) {
    const project = await this.repo.findProjectById(projectId);
    if (!project) return [];

    if (project.ownerId !== userId && project.clientId !== userId) {
      const user = await this.repo.findUserRole(userId);
      this.accessPolicy.assertCanReadProjectConversation({
        userId,
        project,
        role: user?.role,
      });
    }

    return this.repo.findProjectConversationMessages(projectId);
  }

  async markAsRead(messageId: string, userId: string) {
    const result = await this.repo.markMessageRead(messageId, userId);
    await this.repo.markNotificationsReadByMessageId(userId, messageId);
    return result;
  }

  async markConversationRead(userId: string, otherUserId: string) {
    const result = await this.repo.markMessagesReadFromUser(
      otherUserId,
      userId,
    );
    await this.repo.markNotificationsReadBySenderId(userId, otherUserId);
    return result;
  }

  markProjectConversationRead(userId: string, projectId: string) {
    return this.repo.markProjectConversationRead(userId, projectId);
  }

  getUnreadCount(userId: string) {
    return this.repo.countUnreadMessages(userId);
  }

  async getUnreadByProject(userId: string) {
    const notifications =
      await this.repo.findUnreadMessageNotifications(userId);
    const counts = new Map<string, number>();

    for (const notif of notifications) {
      const data = (notif.data ?? {}) as Record<string, unknown>;
      const projectId =
        typeof data.projectId === 'string' ? data.projectId : '';
      if (!projectId) continue;
      counts.set(projectId, (counts.get(projectId) ?? 0) + 1);
    }

    if (counts.size === 0) return [];

    const projectIds = Array.from(counts.keys());
    const projects = await this.repo.findProjectsByIds(projectIds);
    const nameById = new Map(projects.map((p) => [p.id, p.name]));

    return projectIds.map((projectId) => ({
      projectId,
      projectName: nameById.get(projectId) ?? '',
      count: counts.get(projectId) ?? 0,
    }));
  }
}
