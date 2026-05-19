import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationService } from '../../notification/notification.service';
import type { MessageNotifierPort } from '../domain/message.notifier.port';

// Pattern: Adapter — implements MessageNotifierPort using NotificationService
@Injectable()
export class MessageNotifierAdapter implements MessageNotifierPort {
  constructor(private readonly notifications: NotificationService) {}

  async notifyNewMessage(input: {
    recipientId: string;
    title: string;
    body: string;
    metadata: Prisma.InputJsonValue;
  }): Promise<void> {
    await this.notifications.create({
      type: NotificationType.CLIENT_MESSAGE,
      title: input.title,
      message: input.body,
      userId: input.recipientId,
      data: input.metadata,
    });
  }
}
