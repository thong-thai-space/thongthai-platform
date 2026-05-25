import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class NotificationRepository {
  constructor(private prisma: PrismaService) {}

  async findByUser(userId: string) {
    try {
      return await this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch notifications');
    }
  }

  async findById(id: string) {
    try {
      return await this.prisma.notification.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch notification');
    }
  }

  async markAsRead(id: string) {
    try {
      return await this.prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Notification not found');
      }
      throw new InternalServerErrorException('Failed to update notification');
    }
  }

  async markAllAsRead(userId: string) {
    try {
      return await this.prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update notifications');
    }
  }

  async countUnread(userId: string) {
    try {
      return await this.prisma.notification.count({
        where: { userId, isRead: false },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to count notifications');
    }
  }

  async deleteById(id: string) {
    try {
      return await this.prisma.notification.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Notification not found');
      }
      throw new InternalServerErrorException('Failed to delete notification');
    }
  }

  async create(data: Prisma.NotificationCreateInput) {
    try {
      return await this.prisma.notification.create({ data });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create notification');
    }
  }
}
