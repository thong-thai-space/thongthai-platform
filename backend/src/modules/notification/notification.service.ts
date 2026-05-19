import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { PushService } from './push.service';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationOwnershipPolicy } from './policies/notification-ownership.policy';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly gateway: NotificationGateway,
    private readonly pushService: PushService,
    private readonly ownershipPolicy: NotificationOwnershipPolicy,
  ) {}

  findByUser(userId: string) {
    return this.notificationRepository.findByUser(userId);
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) throw new NotFoundException('Notification not found');

    this.ownershipPolicy.assertOwned(notification, userId, 'modify');
    return this.notificationRepository.markAsRead(id);
  }

  markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  getUnreadCount(userId: string) {
    return this.notificationRepository.countUnread(userId);
  }

  async remove(id: string, userId: string) {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) throw new NotFoundException('Notification not found');

    this.ownershipPolicy.assertOwned(notification, userId, 'delete');
    return this.notificationRepository.deleteById(id);
  }

  async create(data: {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    data?: Prisma.InputJsonValue;
  }) {
    const notification = await this.notificationRepository.create({
      type: data.type,
      title: data.title,
      message: data.message,
      user: { connect: { id: data.userId } },
      data: data.data,
    });
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
