import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../notification/notification.service';
import { AiNotificationPort } from '../domain/ai.notification.port';

// Pattern: Adapter
@Injectable()
export class AiNotificationAdapter implements AiNotificationPort {
  constructor(private notificationService: NotificationService) {}

  create(data: {
    type: Parameters<NotificationService['create']>[0]['type'];
    title: string;
    message: string;
    userId: string;
    data?: Parameters<NotificationService['create']>[0]['data'];
  }) {
    return this.notificationService.create(data);
  }
}
