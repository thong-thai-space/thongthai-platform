import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, UserRole, ContactRequestStatus } from '@prisma/client';
import {
  ContactRepositoryPort,
  ContactListFilter,
  ContactListResult,
} from '../domain/contact.repository.port';

// Pattern: Repository
@Injectable()
export class ContactRepository implements ContactRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async createContactRequest(data: Prisma.ContactRequestCreateInput) {
    try {
      return await this.prisma.contactRequest.create({ data });
    } catch {
      throw new InternalServerErrorException(
        'Failed to create contact request',
      );
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
    } catch {
      throw new InternalServerErrorException('Failed to fetch admin users');
    }
  }

  async listContactRequests(
    filter: ContactListFilter,
  ): Promise<ContactListResult> {
    const where: Prisma.ContactRequestWhereInput = {};
    if (filter.status) {
      where.status = filter.status;
    }

    const skip = (filter.page - 1) * filter.pageSize;

    try {
      const [items, total] = await this.prisma.$transaction([
        this.prisma.contactRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: filter.pageSize,
        }),
        this.prisma.contactRequest.count({ where }),
      ]);

      return {
        items,
        total,
        page: filter.page,
        pageSize: filter.pageSize,
      };
    } catch {
      throw new InternalServerErrorException(
        'Failed to list contact requests',
      );
    }
  }

  async findContactRequestById(id: string) {
    try {
      return await this.prisma.contactRequest.findUnique({ where: { id } });
    } catch {
      throw new InternalServerErrorException(
        'Failed to fetch contact request',
      );
    }
  }

  async updateContactRequestStatus(id: string, status: ContactRequestStatus) {
    try {
      return await this.prisma.contactRequest.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Contact request not found');
      }
      throw new InternalServerErrorException(
        'Failed to update contact request status',
      );
    }
  }
}
