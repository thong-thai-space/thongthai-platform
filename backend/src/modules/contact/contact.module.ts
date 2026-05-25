import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { NotificationModule } from '../notification/notification.module';
import { TurnstileService } from '../../common/turnstile/turnstile.service';
import { ContactRepository } from './repositories/contact.repository';
import { ContactUseCases } from './use-cases/contact.use-cases';
import { ContactPolicy } from './policies/contact.policy';
import { ContactSecurityChallengePolicy } from './policies/contact-security-challenge.policy';
import { ContactNotificationAdapter } from './adapters/contact-notification.adapter';
import { TurnstileContactChallengeAdapter } from './adapters/turnstile-contact-challenge.adapter';
import {
  CONTACT_NOTIFICATION_PORT,
  CONTACT_REPOSITORY,
  CONTACT_SECURITY_CHALLENGE,
} from './contact.constants';

@Module({
  imports: [NotificationModule],
  controllers: [ContactController],
  providers: [
    ContactService,
    ContactUseCases,
    ContactPolicy,
    ContactSecurityChallengePolicy,
    ContactRepository,
    ContactNotificationAdapter,
    TurnstileContactChallengeAdapter,
    TurnstileService,
    { provide: CONTACT_REPOSITORY, useExisting: ContactRepository },
    {
      provide: CONTACT_NOTIFICATION_PORT,
      useExisting: ContactNotificationAdapter,
    },
    {
      provide: CONTACT_SECURITY_CHALLENGE,
      useExisting: TurnstileContactChallengeAdapter,
    },
  ],
})
export class ContactModule {}
