import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class PushRepository {
  constructor(private prisma: PrismaService) {}

  async upsertSubscription(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    try {
      return await this.prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: { userId, endpoint: subscription.endpoint },
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to store push subscription',
      );
    }
  }

  async deleteSubscription(userId: string, endpoint: string) {
    try {
      return await this.prisma.pushSubscription.deleteMany({
        where: { userId, endpoint },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove push subscription',
      );
    }
  }

  async findSubscriptions(userId: string) {
    try {
      return await this.prisma.pushSubscription.findMany({
        where: { userId },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch push subscriptions',
      );
    }
  }

  async deleteSubscriptionsByIds(ids: string[]) {
    try {
      return await this.prisma.pushSubscription.deleteMany({
        where: { id: { in: ids } },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to remove push subscriptions',
      );
    }
  }
}
