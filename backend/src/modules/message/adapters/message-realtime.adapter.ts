import { Injectable } from '@nestjs/common';
import { NotificationGateway } from '../../notification/notification.gateway';
import type { MessageRealtimePort } from '../domain/message.realtime.port';

// Pattern: Adapter — bridges domain port to Socket.IO gateway
@Injectable()
export class MessageRealtimeAdapter implements MessageRealtimePort {
  constructor(private readonly gateway: NotificationGateway) {}

  pushNewMessage(recipientId: string, payload: unknown): void {
    this.gateway.sendToUser(recipientId, 'new-message', payload);
  }
}
