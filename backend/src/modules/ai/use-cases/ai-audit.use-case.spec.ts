import { NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import type { AiRepositoryPort } from '../domain/ai.repository.port';
import { AiPolicy } from '../policies/ai.policy';
import { AiAuditUseCase } from './ai-audit.use-case';

function buildSut(envValue?: string) {
  const repo: jest.Mocked<AiRepositoryPort> = {
    createUsageAudit: jest.fn(),
    countUsageAudit: jest.fn(),
    findUsageAuditById: jest.fn(),
    findUsageAuditLogs: jest.fn().mockResolvedValue([]),
    findUsageAuditSummary: jest.fn(),
    updateUsageAudit: jest.fn(),
    deleteUsageAudit: jest.fn(),
    deleteUsageAuditBefore: jest.fn().mockResolvedValue(0),
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
  const aiPolicy = {
    assertOwnerOrAdmin: jest.fn(),
    assertOwnerOnly: jest.fn(),
    assertAuditAccess: jest.fn(),
    assertArchitectureTrialLimit: jest.fn(),
    assertStrategicPlanAccess: jest.fn(),
    assertApplyRequestPending: jest.fn(),
  } as unknown as jest.Mocked<AiPolicy>;
  const configService = {
    get: jest.fn().mockReturnValue(envValue),
  } as unknown as jest.Mocked<ConfigService>;

  return {
    useCase: new AiAuditUseCase(repo, aiPolicy, configService),
    repo,
    aiPolicy,
  };
}

describe('AiAuditUseCase.getLogs', () => {
  it('admin sees all users (no userId filter)', async () => {
    const { useCase, repo } = buildSut();
    await useCase.getLogs('u1', UserRole.ADMIN, 10, 7);

    const call = repo.findUsageAuditLogs.mock.calls[0][0] as Record<string, unknown>;
    expect(call.userId).toBeUndefined();
  });

  it('member is scoped to their own userId', async () => {
    const { useCase, repo } = buildSut();
    await useCase.getLogs('m1', UserRole.MEMBER);
    expect(repo.findUsageAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'm1' }),
      50,
    );
  });

  it('clamps limit to [1, 200]', async () => {
    const { useCase, repo } = buildSut();
    await useCase.getLogs('u1', UserRole.ADMIN, 9999);
    expect(repo.findUsageAuditLogs).toHaveBeenCalledWith(expect.anything(), 200);
  });
});

describe('AiAuditUseCase.updateFeedback', () => {
  it('throws NotFound for missing audit', async () => {
    const { useCase, repo } = buildSut();
    repo.findUsageAuditById.mockResolvedValue(null);
    await expect(
      useCase.updateFeedback('a1', 'u1', UserRole.MEMBER, { effectivenessScore: 5 } as never),
    ).rejects.toThrow(NotFoundException);
  });

  it('enforces audit access before updating', async () => {
    const { useCase, repo, aiPolicy } = buildSut();
    repo.findUsageAuditById.mockResolvedValue({ id: 'a1', userId: 'owner' });

    await useCase.updateFeedback('a1', 'u1', UserRole.MEMBER, {
      effectivenessScore: 5,
    } as never);

    expect(aiPolicy.assertAuditAccess).toHaveBeenCalledWith(UserRole.MEMBER, 'owner', 'u1');
    expect(repo.updateUsageAudit).toHaveBeenCalled();
  });
});

describe('AiAuditUseCase.purge', () => {
  it('requires owner/admin role', () => {
    const { useCase, aiPolicy } = buildSut();
    useCase.purge(UserRole.MEMBER, 30);
    expect(aiPolicy.assertOwnerOrAdmin).toHaveBeenCalledWith(UserRole.MEMBER);
  });

  it('clamps retentionDays to [1, 3650]', async () => {
    const { useCase, repo } = buildSut();
    await useCase.purge(UserRole.OWNER, 99_999);
    // Cutoff should be ~3650 days ago
    const passedCutoff = repo.deleteUsageAuditBefore.mock.calls[0][0];
    const expectedMs = Date.now() - 3650 * 24 * 60 * 60 * 1000;
    expect(Math.abs(passedCutoff.getTime() - expectedMs)).toBeLessThan(60_000);
  });
});

describe('AiAuditUseCase.runRetentionCron', () => {
  it('reads retention days from config', async () => {
    const { useCase, repo } = buildSut('45');
    await useCase.runRetentionCron();
    expect(repo.deleteUsageAuditBefore).toHaveBeenCalled();
  });
});
