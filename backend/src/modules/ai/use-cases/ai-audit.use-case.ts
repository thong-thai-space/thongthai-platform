import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { AiAuditFeedbackDto } from '../dto/ai.dto';
import { AI_REPOSITORY } from '../ai.constants';
import type { AiRepositoryPort } from '../domain/ai.repository.port';
import { AiPolicy } from '../policies/ai.policy';

const DAY_MS = 24 * 60 * 60 * 1000;

// Pattern: Use Case — read + admin operations on AI usage audit logs
@Injectable()
export class AiAuditUseCase {
  private readonly logger = new Logger(AiAuditUseCase.name);

  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repo: AiRepositoryPort,
    private readonly aiPolicy: AiPolicy,
    private readonly configService: ConfigService,
  ) {}

  getLogs(userId: string, role: UserRole, limit = 50, days = 30) {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    const safeDays = Math.max(1, Math.min(days, 3650));
    const createdAtFrom = new Date(Date.now() - safeDays * DAY_MS);

    const where =
      role === UserRole.OWNER || role === UserRole.ADMIN
        ? { createdAt: { gte: createdAtFrom } }
        : { userId, createdAt: { gte: createdAtFrom } };

    return this.repo.findUsageAuditLogs(where, safeLimit);
  }

  async getSummary(userId: string, role: UserRole, days = 30) {
    const safeDays = Math.max(1, Math.min(days, 3650));
    const createdAtFrom = new Date(Date.now() - safeDays * DAY_MS);

    const baseWhere =
      role === UserRole.OWNER || role === UserRole.ADMIN
        ? { createdAt: { gte: createdAtFrom } }
        : { userId, createdAt: { gte: createdAtFrom } };

    const logs = await this.repo.findUsageAuditSummary(baseWhere);
    const totalRequests = logs.length;
    const successfulRequests = logs.filter((l) => l.success).length;
    const totalTokens = logs.reduce((sum, l) => sum + (l.totalTokens || 0), 0);
    const totalCostUsd = logs.reduce(
      (sum, l) => sum + Number(l.estimatedCostUsd || 0),
      0,
    );
    const avgDurationMs =
      totalRequests > 0
        ? Math.round(logs.reduce((sum, l) => sum + (l.durationMs || 0), 0) / totalRequests)
        : 0;

    const byFeatureMap = new Map<string, { requests: number; success: number; costUsd: number }>();
    for (const log of logs) {
      const entry = byFeatureMap.get(log.feature) || { requests: 0, success: 0, costUsd: 0 };
      entry.requests += 1;
      entry.success += log.success ? 1 : 0;
      entry.costUsd += Number(log.estimatedCostUsd || 0);
      byFeatureMap.set(log.feature, entry);
    }
    const byFeature = Array.from(byFeatureMap.entries()).map(([feature, value]) => ({
      feature,
      requests: value.requests,
      successRate: value.requests ? value.success / value.requests : 0,
      costUsd: Number(value.costUsd.toFixed(4)),
    }));

    return {
      rangeDays: safeDays,
      totalRequests,
      successRate: totalRequests ? successfulRequests / totalRequests : 0,
      totalTokens,
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      avgDurationMs,
      byFeature,
    };
  }

  async updateFeedback(
    auditId: string,
    userId: string,
    role: UserRole,
    dto: AiAuditFeedbackDto,
  ) {
    const audit = await this.repo.findUsageAuditById(auditId);
    if (!audit) throw new NotFoundException('AI audit record not found');

    this.aiPolicy.assertAuditAccess(role, audit.userId, userId);

    return this.repo.updateUsageAudit(auditId, {
      effectivenessScore: dto.effectivenessScore,
      feedbackNote: dto.feedbackNote,
    });
  }

  async deleteLog(auditId: string, userId: string, role: UserRole) {
    const audit = await this.repo.findUsageAuditById(auditId);
    if (!audit) throw new NotFoundException('AI audit record not found');

    this.aiPolicy.assertAuditAccess(role, audit.userId, userId);
    return this.repo.deleteUsageAudit(auditId);
  }

  purge(role: UserRole, retentionDays = 90) {
    this.aiPolicy.assertOwnerOrAdmin(role);
    return this.purgeInternal(retentionDays);
  }

  async runRetentionCron() {
    const retentionFromEnv = Number(this.configService.get('AI_AUDIT_RETENTION_DAYS') || 90);
    const result = await this.purgeInternal(retentionFromEnv);
    this.logger.log(
      `AI audit retention cron executed. Deleted ${result.deletedCount} records older than ${result.retentionDays} day(s).`,
    );
  }

  private async purgeInternal(retentionDays = 90) {
    const safeRetention = Math.max(1, Math.min(retentionDays, 3650));
    const cutoff = new Date(Date.now() - safeRetention * DAY_MS);
    const deletedCount = await this.repo.deleteUsageAuditBefore(cutoff);
    return { retentionDays: safeRetention, deletedCount };
  }
}
