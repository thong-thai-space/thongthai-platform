import { HttpException, NotFoundException } from '@nestjs/common';
import { AiFeature } from '@prisma/client';
import type { AiRepositoryPort } from '../domain/ai.repository.port';
import { AiAuditService } from './ai-audit.service';

function buildSut() {
  const repo: jest.Mocked<AiRepositoryPort> = {
    createUsageAudit: jest.fn().mockResolvedValue({}),
    countUsageAudit: jest.fn(),
    findUsageAuditById: jest.fn(),
    findUsageAuditLogs: jest.fn(),
    findUsageAuditSummary: jest.fn(),
    updateUsageAudit: jest.fn(),
    deleteUsageAudit: jest.fn(),
    deleteUsageAuditBefore: jest.fn(),
    findPromptSection: jest.fn(),
    findUserQuota: jest.fn(),
    incrementUserQuota: jest.fn(),
    findConversationWithMessages: jest.fn(),
    createConversation: jest.fn(),
    createMessage: jest.fn(),
    findProjectsForChatContext: jest.fn(),
    getOperationalSnapshot: jest.fn(),
    findProjectForProgressReport: jest.fn(),
    findProjectForStrategicPlan: jest.fn(),
    findProjectSummary: jest.fn(),
    createApplyRequest: jest.fn(),
    listApplyRequests: jest.fn(),
    findApplyRequestById: jest.fn(),
    updateApplyRequest: jest.fn(),
    findOwnerIds: jest.fn(),
    findMilestoneTitles: jest.fn(),
    findAiTaskTitles: jest.fn(),
    findActiveMembers: jest.fn(),
    createMilestone: jest.fn(),
    createTask: jest.fn(),
    findPublicBrandContextData: jest.fn(),
  };
  return { service: new AiAuditService(repo), repo };
}

describe('AiAuditService.log', () => {
  it('persists audit with connect wrappers for relations', async () => {
    const { service, repo } = buildSut();
    await service.log({
      feature: AiFeature.CHAT,
      userId: 'u1',
      projectId: 'p1',
      success: true,
      inputTokens: 100,
      outputTokens: 200,
      totalTokens: 300,
      estimatedCostUsd: 0.0009,
    });

    expect(repo.createUsageAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        feature: AiFeature.CHAT,
        user: { connect: { id: 'u1' } },
        project: { connect: { id: 'p1' } },
        success: true,
      }),
    );
  });

  it('swallows repository errors so AI flow continues', async () => {
    const { service, repo } = buildSut();
    repo.createUsageAudit.mockRejectedValue(new Error('db down'));

    await expect(
      service.log({ feature: AiFeature.CHAT, success: false }),
    ).resolves.toBeUndefined();
  });
});

describe('AiAuditService.consumeQuota', () => {
  it('throws NotFound when user missing', async () => {
    const { service, repo } = buildSut();
    repo.findUserQuota.mockResolvedValue(null);
    await expect(service.consumeQuota('u1', 100)).rejects.toThrow(NotFoundException);
  });

  it('throws when quota exceeded', async () => {
    const { service, repo } = buildSut();
    repo.findUserQuota.mockResolvedValue({
      id: 'u1',
      aiQuotaUsedTokens: 99_999,
      aiQuotaLimitTokens: 100_000,
    });
    await expect(service.consumeQuota('u1', 1000)).rejects.toThrow(HttpException);
  });

  it('increments quota on success', async () => {
    const { service, repo } = buildSut();
    repo.findUserQuota.mockResolvedValue({
      id: 'u1',
      aiQuotaUsedTokens: 100,
      aiQuotaLimitTokens: 100_000,
    });
    await service.consumeQuota('u1', 500);
    expect(repo.incrementUserQuota).toHaveBeenCalledWith('u1', 500);
  });
});
