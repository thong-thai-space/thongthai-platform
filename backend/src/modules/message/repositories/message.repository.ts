import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType, Prisma, UserRole } from '@prisma/client';

/**
 * Pattern: Repository Pattern
 * Encapsulates Message data access
 */
@Injectable()
export class MessageRepository {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: Prisma.MessageUncheckedCreateInput) {
    return this.prisma.message.create({
      data,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async findUserName(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
  }

  async findProjectName(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true },
    });
  }

  async findProjectParticipants(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        ownerId: true,
        clientId: true,
        tasks: { select: { assigneeId: true } },
      },
    });
  }

  async findAdminIds() {
    return this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.OWNER, UserRole.ADMIN] },
        isActive: true,
      },
      select: { id: true },
    });
  }

  async findDistinctSentReceivers(userId: string) {
    return this.prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });
  }

  async findDistinctReceivedSenders(userId: string) {
    return this.prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });
  }

  async findUserSummary(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true, role: true },
    });
  }

  async findLastMessageBetween(userId: string, otherUserId: string) {
    return this.prisma.message.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countUnreadFromUser(senderId: string, receiverId: string) {
    return this.prisma.message.count({
      where: {
        senderId,
        receiverId,
        isRead: false,
      },
    });
  }

  async findConversationMessages(userId: string, otherUserId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });
  }

  async findProjectById(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, clientId: true },
    });
  }

  async findUserRole(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
  }

  async findProjectConversationMessages(projectId: string) {
    return this.prisma.message.findMany({
      where: { projectId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async markMessageRead(messageId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: { id: messageId, receiverId: userId },
      data: { isRead: true },
    });
  }

  async markNotificationsReadByMessageId(userId: string, messageId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        type: NotificationType.CLIENT_MESSAGE,
        data: {
          path: ['messageId'],
          equals: messageId,
        },
      },
      data: { isRead: true },
    });
  }

  async markMessagesReadFromUser(otherUserId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async markNotificationsReadBySenderId(userId: string, otherUserId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
        type: NotificationType.CLIENT_MESSAGE,
        data: {
          path: ['senderId'],
          equals: otherUserId,
        },
      },
      data: { isRead: true },
    });
  }

  async markProjectConversationRead(userId: string, projectId: string) {
    const [messageResult] = await this.prisma.$transaction([
      this.prisma.message.updateMany({
        where: {
          projectId,
          receiverId: userId,
          isRead: false,
        },
        data: { isRead: true },
      }),
      this.prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
          type: NotificationType.CLIENT_MESSAGE,
          data: {
            path: ['projectId'],
            equals: projectId,
          },
        },
        data: { isRead: true },
      }),
    ]);

    return messageResult;
  }

  async countUnreadMessages(userId: string) {
    return this.prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  async findUnreadMessageNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: {
        userId,
        type: NotificationType.CLIENT_MESSAGE,
        isRead: false,
      },
      select: { data: true },
    });
  }

  async findProjectsByIds(projectIds: string[]) {
    return this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true },
    });
  }
}
