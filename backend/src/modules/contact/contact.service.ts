import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { TurnstileService } from '../../common/turnstile/turnstile.service';
import { UserRole, NotificationType } from '@prisma/client';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';

@Injectable()
export class ContactService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private turnstileService: TurnstileService,
  ) {}

  async create(dto: CreateContactRequestDto, remoteIp?: string) {
    // Only verify Turnstile if token is provided
    if (dto.turnstileToken) {
      const isTurnstileValid = await this.turnstileService.verify(
        dto.turnstileToken,
        remoteIp,
      );
      if (!isTurnstileValid) {
        throw new BadRequestException('Turnstile verification failed');
      }
    }

    const { turnstileToken: _, ...contactPayload } = dto;
    const contactRequest = await this.prisma.contactRequest.create({
      data: contactPayload,
    });

    // Notify all OWNER and ADMIN users
    const admins = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.OWNER, UserRole.ADMIN] },
        isActive: true,
      },
      select: { id: true },
    });

    for (const admin of admins) {
      await this.notificationService.create({
        type: NotificationType.CONTACT_REQUEST,
        title: 'New contact request',
        message: `${dto.name} (${dto.email}) submitted a contact request${dto.service ? `: ${dto.service}` : ''}.`,
        userId: admin.id,
        data: { contactRequestId: contactRequest.id },
      });
    }

    return contactRequest;
  }
}
