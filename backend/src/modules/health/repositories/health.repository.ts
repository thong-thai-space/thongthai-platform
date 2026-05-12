import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../../prisma/prisma.service';

type CheckStatus = 'up' | 'down';

/**
 * Pattern: Repository Pattern
 * Encapsulates infrastructure health checks
 */
@Injectable()
export class HealthRepository {
  private redisClient: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async checkDatabase(): Promise<{ status: CheckStatus }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up' };
    } catch {
      throw new ServiceUnavailableException('Database ping failed');
    }
  }

  async checkRedis(): Promise<{ status: CheckStatus }> {
    const client = this.getRedisClient();
    if (client.status === 'wait') {
      await client.connect();
    }

    const result = await client.ping();
    if (result !== 'PONG') {
      throw new ServiceUnavailableException('Redis ping failed');
    }

    return { status: 'up' };
  }

  async disconnect() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  private getRedisClient() {
    if (!this.redisClient) {
      this.redisClient = new Redis(this.configService.getOrThrow('REDIS_URL'), {
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      });
    }

    return this.redisClient;
  }
}
