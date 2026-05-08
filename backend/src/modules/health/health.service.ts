import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

type CheckStatus = 'up' | 'down';

@Injectable()
export class HealthService implements OnModuleDestroy {
  private redisClient: Redis | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  live() {
    return {
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const database = this.toStatus(checks[0]);
    const redis = this.toStatus(checks[1]);
    const allUp = database.status === 'up' && redis.status === 'up';

    const payload = {
      status: allUp ? 'ok' : 'degraded',
      service: 'backend',
      checks: {
        database,
        redis,
      },
      timestamp: new Date().toISOString(),
    };

    if (!allUp) {
      throw new ServiceUnavailableException(payload);
    }

    return payload;
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  private async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'up' as CheckStatus };
  }

  private async checkRedis() {
    const client = this.getRedisClient();
    if (client.status === 'wait') {
      await client.connect();
    }

    const result = await client.ping();
    if (result !== 'PONG') {
      throw new Error('Redis ping failed');
    }

    return { status: 'up' as CheckStatus };
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

  private toStatus(result: PromiseSettledResult<{ status: CheckStatus }>): {
    status: CheckStatus;
    error?: string;
  } {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      status: 'down',
      error:
        result.reason instanceof Error
          ? result.reason.message
          : 'Unknown error',
    };
  }
}
