import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '@prisma/client';
import { CreateMessageDto } from './dto/message.dto';

@Injectable()
export class MessageService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private gateway: NotificationGateway,
  ) {}

  async create(senderId: string, dto: CreateMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
        senderId,
        receiverId: dto.receiverId,
        projectId: dto.projectId,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
    });

    // Push real-time message via WebSocket
    this.gateway.sendToUser(dto.receiverId, 'new-message', message);

    // Create notification for receiver
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true },
    });

    let projectName = '';
    if (dto.projectId) {
      const proj = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
        select: { name: true },
      });
      projectName = proj?.name || '';
    }

    await this.notificationService.create({
      type: NotificationType.CLIENT_MESSAGE,
      title: 'New message',
      message: projectName
        ? `${sender?.name || 'Someone'} sent a message in project "${projectName}".`
        : `${sender?.name || 'Someone'} sent you a message.`,
      userId: dto.receiverId,
      data: { senderId, messageId: message.id, projectId: dto.projectId },
    });

    return message;
  }

  async findConversations(userId: string) {
    // Find distinct user IDs the current user has messaged with
    const sent = await this.prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const received = await this.prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const userIds = [
      ...new Set([
        ...sent.map((m) => m.receiverId),
        ...received.map((m) => m.senderId),
      ]),
    ];

    const conversations = await Promise.all(
      userIds.map(async (otherUserId) => {
        const otherUser = await this.prisma.user.findUnique({
          where: { id: otherUserId },
          select: { id: true, name: true, avatar: true, role: true },
        });

        const lastMessage = await this.prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
        });

        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            isRead: false,
          },
        });

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

  async findProjectConversation(projectId: string, userId: string) {
    // Verify user is a participant of the project
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true, clientId: true },
    });

    if (!project) return [];
    if (project.ownerId !== userId && project.clientId !== userId) {
      // Check if user is OWNER or ADMIN (team member)
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (!user || !['OWNER', 'ADMIN', 'MEMBER'].includes(user.role)) {
        throw new ForbiddenException();
      }
    }

    return this.prisma.message.findMany({
      where: { projectId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
  }

  async markAsRead(messageId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: { id: messageId, receiverId: userId },
      data: { isRead: true },
    });
  }

  async markConversationRead(userId: string, otherUserId: string) {
    return this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }
}
