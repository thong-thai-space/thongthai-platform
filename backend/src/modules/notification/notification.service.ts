import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { PushService } from './push.service';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationRepository } from './repositories/notification.repository';

@Injectable()
export class NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private gateway: NotificationGateway,
    private pushService: PushService,
  ) {}

  async findByUser(userId: string) {
    return this.notificationRepository.findByUser(userId);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Pattern: Authorization - Ownership check
    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to modify this notification');
    }

    return this.notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepository.countUnread(userId);
  }

  async remove(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Pattern: Authorization - Ownership check
    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have permission to delete this notification');
    }

    return this.notificationRepository.deleteById(id);
  }

  async create(data: {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    data?: Prisma.InputJsonValue;
  }) {
    const notification = await this.notificationRepository.create(data);
    this.gateway.sendToUser(data.userId, 'notification', notification);

    // Send browser push notification for offline delivery
    this.pushService.sendPush(data.userId, {
      title: data.title,
      body: data.message,
      url: '/dashboard',
    });

    return notification;
  }
}
