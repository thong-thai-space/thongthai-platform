import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AiFeature, Prisma } from '@prisma/client';
import { AI_REPOSITORY } from '../ai.constants';
import type { AiRepositoryPort } from '../domain/ai.repository.port';

export interface AiAuditEntry {
  feature: AiFeature;
  userId?: string;
  projectId?: string;
  model?: string;
  success: boolean;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  durationMs?: number;
  errorMessage?: string;
  metadata?: unknown;
}

// Pattern: Application Service — single place that writes audit logs + enforces quota
@Injectable()
export class AiAuditService {
  private readonly logger = new Logger(AiAuditService.name);

  constructor(
    @Inject(AI_REPOSITORY)
    private readonly aiRepository: AiRepositoryPort,
  ) {}

  async log(entry: AiAuditEntry): Promise<void> {
    try {
      await this.aiRepository.createUsageAudit({
        feature: entry.feature,
        ...(entry.userId ? { user: { connect: { id: entry.userId } } } : {}),
        ...(entry.projectId ? { project: { connect: { id: entry.projectId } } } : {}),
        model: entry.model,
        success: entry.success,
        inputTokens: entry.inputTokens,
        outputTokens: entry.outputTokens,
        totalTokens: entry.totalTokens,
        estimatedCostUsd:
          entry.estimatedCostUsd !== undefined
            ? new Prisma.Decimal(entry.estimatedCostUsd.toFixed(6))
            : undefined,
        durationMs: entry.durationMs,
        errorMessage: entry.errorMessage,
        metadata: entry.metadata as Prisma.InputJsonValue | undefined,
      });
    } catch (error) {
      // Never block AI response; log so audit gaps are visible to ops.
      this.logger.warn(
        `Failed to persist AI usage audit (feature=${entry.feature}): ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  async consumeQuota(userId: string, totalTokens: number): Promise<void> {
    const user = await this.aiRepository.findUserQuota(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.aiQuotaUsedTokens + totalTokens > user.aiQuotaLimitTokens) {
      throw new HttpException('AI quota exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.aiRepository.incrementUserQuota(userId, totalTokens);
  }
}
