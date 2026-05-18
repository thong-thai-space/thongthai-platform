import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, UserRole } from '@prisma/client';
import { ContactRepositoryPort } from '../domain/contact.repository.port';

// Pattern: Repository
@Injectable()
export class ContactRepository implements ContactRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async createContactRequest(data: Prisma.ContactRequestCreateInput) {
    try {
      return await this.prisma.contactRequest.create({ data });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create contact request');
    }
  }

  async findActiveAdminIds(): Promise<string[]> {
    try {
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: [UserRole.OWNER, UserRole.ADMIN] },
          isActive: true,
        },
        select: { id: true },
      });
      return admins.map((admin) => admin.id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch admin users');
    }
  }
}
