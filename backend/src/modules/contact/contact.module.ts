import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { NotificationModule } from '../notification/notification.module';
import { TurnstileModule } from '../../common/turnstile/turnstile.module';
import { TurnstileService } from '../../common/turnstile/turnstile.service';

@Module({
  imports: [TurnstileModule, NotificationModule],
  controllers: [ContactController],
  providers: [ContactService, TurnstileService],
})
export class ContactModule {}
