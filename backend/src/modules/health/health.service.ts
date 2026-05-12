import {
  Injectable,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HealthRepository } from './repositories/health.repository';

type CheckStatus = 'up' | 'down';

@Injectable()
export class HealthService implements OnModuleDestroy {
  constructor(private readonly healthRepository: HealthRepository) {}

  live() {
    return {
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }

  async ready() {
    const checks = await Promise.allSettled([
      this.healthRepository.checkDatabase(),
      this.healthRepository.checkRedis(),
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
    await this.healthRepository.disconnect();
  }

  private toStatus(
    result: PromiseSettledResult<{ status: CheckStatus }>,
  ): { status: CheckStatus; error?: string } {
    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      status: 'down',
      error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
    };
  }
}
