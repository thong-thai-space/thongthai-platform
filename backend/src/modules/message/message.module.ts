import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessageRepository } from './repositories/message.repository';

@Module({
  imports: [NotificationModule, PrismaModule],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository],
  exports: [MessageService],
})
export class MessageModule {}
