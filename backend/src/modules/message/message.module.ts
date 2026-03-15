import { Module } from '@nestjs/common';
import { NotificationModule } from '../notification/notification.module';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';

@Module({
  imports: [NotificationModule],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
