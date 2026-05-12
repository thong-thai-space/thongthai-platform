import { Injectable, ForbiddenException } from '@nestjs/common';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType, UserRole } from '@prisma/client';
import { CreateMessageDto } from './dto/message.dto';
import { MessageRepository } from './repositories/message.repository';

@Injectable()
export class MessageService {
  constructor(
    private messageRepository: MessageRepository,
    private notificationService: NotificationService,
    private gateway: NotificationGateway,
  ) {}

  async create(senderId: string, dto: CreateMessageDto) {
    const message = await this.messageRepository.createMessage({
      content: dto.content,
      senderId,
      receiverId: dto.receiverId,
      ...(dto.projectId ? { projectId: dto.projectId } : {}),
    });

    // Push real-time message via WebSocket
    this.gateway.sendToUser(dto.receiverId, 'new-message', message);

    // Create notification for receiver(s)
    const sender = await this.messageRepository.findUserName(senderId);

    let projectName = '';
    if (dto.projectId) {
      const proj = await this.messageRepository.findProjectName(dto.projectId);
      projectName = proj?.name || '';
    }

    const receivers = new Set<string>();

    // Direct receiver always gets the notification (except self-message).
    if (dto.receiverId && dto.receiverId !== senderId) {
      receivers.add(dto.receiverId);
    }

    // For project chat, also notify internal participants so admin/member can see badge updates.
    if (dto.projectId) {
      const project = await this.messageRepository.findProjectParticipants(dto.projectId);

      if (project?.ownerId) receivers.add(project.ownerId);
      if (project?.clientId) receivers.add(project.clientId);
      for (const task of project?.tasks || []) {
        if (task.assigneeId) receivers.add(task.assigneeId);
      }

      const admins = await this.messageRepository.findAdminIds();
      for (const admin of admins) receivers.add(admin.id);
    }

    receivers.delete(senderId);

    for (const receiverId of receivers) {
      await this.notificationService.create({
        type: NotificationType.CLIENT_MESSAGE,
        title: 'New message',
        message: projectName
          ? `${sender?.name || 'Someone'} sent a message in project "${projectName}".`
          : `${sender?.name || 'Someone'} sent you a message.`,
        userId: receiverId,
        data: { senderId, messageId: message.id, projectId: dto.projectId },
      });
    }

    return message;
  }

  async findConversations(userId: string) {
    // Find distinct user IDs the current user has messaged with
    const sent = await this.messageRepository.findDistinctSentReceivers(userId);

    const received = await this.messageRepository.findDistinctReceivedSenders(userId);

    const userIds = [
      ...new Set([
        ...sent.map((m) => m.receiverId).filter(Boolean),
        ...received.map((m) => m.senderId).filter(Boolean),
      ]),
    ];

    const conversations = await Promise.all(
      userIds.map(async (otherUserId) => {
        const otherUser = await this.messageRepository.findUserSummary(otherUserId);

        const lastMessage = await this.messageRepository.findLastMessageBetween(
          userId,
          otherUserId,
        );

        const unreadCount = await this.messageRepository.countUnreadFromUser(
          otherUserId,
          userId,
        );

        return {
          userId: otherUserId,
          user: otherUser,
          lastMessage,
          unreadCount,
        };
      }),
    );

    return conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.getTime() || 0;
      const bTime = b.lastMessage?.createdAt?.getTime() || 0;
      return bTime - aTime;
    });
  }

  async findConversation(userId: string, otherUserId: string) {
    // Pattern: Authorization - Ownership check
    // Only the participants of a conversation can view it
    return this.messageRepository.findConversationMessages(userId, otherUserId);
  }

  async findProjectConversation(projectId: string, userId: string) {
    // Verify user is a participant of the project
    const project = await this.messageRepository.findProjectById(projectId);

    if (!project) return [];
    if (project.ownerId !== userId && project.clientId !== userId) {
      // Check if user is OWNER or ADMIN (team member)
      const user = await this.messageRepository.findUserRole(userId);
      if (!user || !['OWNER', 'ADMIN', 'MEMBER'].includes(user.role)) {
        throw new ForbiddenException();
      }
    }

    return this.messageRepository.findProjectConversationMessages(projectId);
  }

  async markAsRead(messageId: string, userId: string) {
    const result = await this.messageRepository.markMessageRead(messageId, userId);

    // Keep message-related notifications in sync with message read state.
    await this.messageRepository.markNotificationsReadByMessageId(userId, messageId);

    return result;
  }

  async markConversationRead(userId: string, otherUserId: string) {
    const result = await this.messageRepository.markMessagesReadFromUser(otherUserId, userId);

    await this.messageRepository.markNotificationsReadBySenderId(userId, otherUserId);

    return result;
  }

  async markProjectConversationRead(userId: string, projectId: string) {
    return this.messageRepository.markProjectConversationRead(userId, projectId);
  }

  async getUnreadCount(userId: string) {
    return this.messageRepository.countUnreadMessages(userId);
  }

  async getUnreadByProject(userId: string) {
    const unreadNotifications = await this.messageRepository.findUnreadMessageNotifications(userId);

    const counter = new Map<string, number>();
    for (const item of unreadNotifications) {
      const data = (item.data || {}) as Record<string, unknown>;
      const projectId = typeof data.projectId === 'string' ? data.projectId : '';
      if (!projectId) continue;
      counter.set(projectId, (counter.get(projectId) || 0) + 1);
    }

    if (counter.size === 0) return [];

    const projectIds = Array.from(counter.keys());

    const projects = await this.messageRepository.findProjectsByIds(projectIds);

    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    return projectIds.map((projectId) => ({
      projectId,
      projectName: projectMap.get(projectId) || '',
      count: counter.get(projectId) || 0,
    }));
  }
}
