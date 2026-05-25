import { Inject, Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { CreateContactRequestDto } from '../dto/create-contact-request.dto';
import {
  CONTACT_NOTIFICATION_PORT,
  CONTACT_REPOSITORY,
} from '../contact.constants';
import type { ContactNotificationPort } from '../domain/contact.notification.port';
import type { ContactRepositoryPort } from '../domain/contact.repository.port';
import { ContactPolicy } from '../policies/contact.policy';
import { ContactSecurityChallengePolicy } from '../policies/contact-security-challenge.policy';

// Pattern: Use Case
@Injectable()
export class ContactUseCases {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private contactRepository: ContactRepositoryPort,
    @Inject(CONTACT_NOTIFICATION_PORT)
    private notificationPort: ContactNotificationPort,
    private contactPolicy: ContactPolicy,
    private challengePolicy: ContactSecurityChallengePolicy,
  ) {}

  async create(dto: CreateContactRequestDto, remoteIp?: string) {
    // Pattern: Guard — bot challenge enforced before any DB write or notification.
    await this.challengePolicy.enforce(dto.turnstileToken, remoteIp);

    const contactRequest = await this.contactRepository.createContactRequest({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      company: dto.company,
      service: dto.service,
      budget: dto.budget,
      message: dto.message,
    });

    const adminIds = await this.contactRepository.findActiveAdminIds();
    const recipients =
      this.contactPolicy.resolveNotificationRecipients(adminIds);

    for (const adminId of recipients) {
      await this.notificationPort.create({
        type: NotificationType.CONTACT_REQUEST,
        title: 'New contact request',
        message: `${dto.name} (${dto.email}) submitted a contact request${
          dto.service ? `: ${dto.service}` : ''
        }.`,
        userId: adminId,
        data: { contactRequestId: contactRequest.id },
      });
    }

    return contactRequest;
  }
}
