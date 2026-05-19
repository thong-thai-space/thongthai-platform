import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { MessageRepository } from './repositories/message.repository';
import { MessageUseCases } from './use-cases/message.use-cases';
import { MessageAccessPolicy } from './policies/message-access.policy';
import { MessageNotifierAdapter } from './adapters/message-notifier.adapter';
import { MessageRealtimeAdapter } from './adapters/message-realtime.adapter';
import {
  MESSAGE_NOTIFIER,
  MESSAGE_REALTIME,
  MESSAGE_REPOSITORY,
} from './message.constants';

// Pattern: Composition Root — ports bound to adapters here
@Module({
  imports: [NotificationModule, PrismaModule],
  controllers: [MessageController],
  providers: [
    MessageService,
    MessageUseCases,
    MessageRepository,
    MessageNotifierAdapter,
    MessageRealtimeAdapter,
    MessageAccessPolicy,
    { provide: MESSAGE_REPOSITORY, useExisting: MessageRepository },
    { provide: MESSAGE_NOTIFIER, useExisting: MessageNotifierAdapter },
    { provide: MESSAGE_REALTIME, useExisting: MessageRealtimeAdapter },
  ],
  exports: [MessageService],
})
export class MessageModule {}
