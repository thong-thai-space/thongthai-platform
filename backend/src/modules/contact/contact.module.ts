import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { NotificationModule } from '../notification/notification.module';
import { ContactRepository } from './repositories/contact.repository';
import { ContactUseCases } from './use-cases/contact.use-cases';
import { ContactPolicy } from './policies/contact.policy';
import { ContactNotificationAdapter } from './adapters/contact-notification.adapter';
import { CONTACT_NOTIFICATION_PORT, CONTACT_REPOSITORY } from './contact.constants';

@Module({
  imports: [NotificationModule],
  controllers: [ContactController],
  providers: [
    ContactService,
    ContactUseCases,
    ContactPolicy,
    ContactRepository,
    ContactNotificationAdapter,
    { provide: CONTACT_REPOSITORY, useExisting: ContactRepository },
    { provide: CONTACT_NOTIFICATION_PORT, useExisting: ContactNotificationAdapter },
  ],
})
export class ContactModule {}
