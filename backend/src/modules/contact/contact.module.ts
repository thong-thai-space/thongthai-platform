import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';
import { TurnstileService } from '../../common/turnstile/turnstile.service';
import { ContactRepository } from './repositories/contact.repository';
import { ContactUseCases } from './use-cases/contact.use-cases';
import { ListLeadsUseCase } from './use-cases/list-leads.use-case';
import { UpdateLeadStatusUseCase } from './use-cases/update-lead-status.use-case';
import { ContactPolicy } from './policies/contact.policy';
import { ContactSecurityChallengePolicy } from './policies/contact-security-challenge.policy';
import { ContactStatusPolicy } from './policies/contact-status.policy';
import { ContactNotificationAdapter } from './adapters/contact-notification.adapter';
import { TurnstileContactChallengeAdapter } from './adapters/turnstile-contact-challenge.adapter';
import {
  CONTACT_NOTIFICATION_PORT,
  CONTACT_REPOSITORY,
  CONTACT_SECURITY_CHALLENGE,
} from './contact.constants';

@Module({
  // AuthModule is imported so RolesGuard / JwtStrategy are available for the admin endpoints.
  imports: [NotificationModule, AuthModule],
  controllers: [ContactController],
  providers: [
    ContactService,
    ContactUseCases,
    ListLeadsUseCase,
    UpdateLeadStatusUseCase,
    ContactPolicy,
    ContactSecurityChallengePolicy,
    ContactStatusPolicy,
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
