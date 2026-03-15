import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationType, Prisma } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationGateway,
  ) {}

  async findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async remove(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  async create(data: {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    data?: Prisma.InputJsonValue;
  }) {
    const notification = await this.prisma.notification.create({ data });
    this.gateway.sendToUser(data.userId, 'notification', notification);
    return notification;
  }
}
