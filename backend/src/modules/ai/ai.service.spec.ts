import { AiService } from './ai.service';
import type { AiArchitectureUseCase } from './use-cases/ai-architecture.use-case';
import type { AiAuditUseCase } from './use-cases/ai-audit.use-case';
import type { AiChatUseCase } from './use-cases/ai-chat.use-case';
import type { AiGenerationUseCase } from './use-cases/ai-generation.use-case';
import type { AiPublicChatUseCase } from './use-cases/ai-public-chat.use-case';
import type { AiStrategicPlanUseCase } from './use-cases/ai-strategic-plan.use-case';

describe('AiService (facade)', () => {
  function buildSut() {
    const architecture = { execute: jest.fn() } as unknown as jest.Mocked<AiArchitectureUseCase>;
    const chat = {
      execute: jest.fn().mockResolvedValue({ conversationId: 'c1', message: 'hi', usage: {} }),
    } as unknown as jest.Mocked<AiChatUseCase>;
    const generation = {
      generateProposal: jest.fn(),
      breakdownTasks: jest.fn(),
      reviewCode: jest.fn(),
      estimateProject: jest.fn(),
      generateProgressReport: jest.fn(),
    } as unknown as jest.Mocked<AiGenerationUseCase>;
    const strategicPlan = {
      generatePlan: jest.fn(),
      apply: jest.fn(),
      listApplyRequests: jest.fn(),
      reviewApplyRequest: jest.fn(),
    } as unknown as jest.Mocked<AiStrategicPlanUseCase>;
    const audit = {
      getLogs: jest.fn(),
      getSummary: jest.fn(),
      updateFeedback: jest.fn(),
      deleteLog: jest.fn(),
      purge: jest.fn(),
      runRetentionCron: jest.fn(),
    } as unknown as jest.Mocked<AiAuditUseCase>;
    const publicChat = {
      execute: jest.fn().mockResolvedValue({ message: 'hi back' }),
    } as unknown as jest.Mocked<AiPublicChatUseCase>;

    const service = new AiService(architecture, chat, generation, strategicPlan, audit, publicChat);
    return { service, architecture, chat, generation, strategicPlan, audit, publicChat };
  }

  it('delegates chat to AiChatUseCase', async () => {
    const { service, chat } = buildSut();
    await service.chat('u1', 'hello');
    expect(chat.execute).toHaveBeenCalledWith('u1', 'hello', undefined, undefined);
  });

  it('delegates generateProposal to AiGenerationUseCase', async () => {
    const { service, generation } = buildSut();
    await service.generateProposal('u1', 'OWNER' as never, 'req', 'EN' as never, '$5k');
    expect(generation.generateProposal).toHaveBeenCalledWith('u1', 'OWNER', 'req', 'EN', '$5k');
  });

  it('delegates generateArchitectureDiagram to AiArchitectureUseCase', async () => {
    const { service, architecture } = buildSut();
    await service.generateArchitectureDiagram('u1', 'OWNER' as never, 'msg');
    expect(architecture.execute).toHaveBeenCalledWith('u1', 'OWNER', 'msg', undefined);
  });

  it('delegates chatPublic to AiPublicChatUseCase', async () => {
    const { service, publicChat } = buildSut();
    await service.chatPublic('hi');
    expect(publicChat.execute).toHaveBeenCalledWith('hi');
  });

  it('delegates strategic plan to AiStrategicPlanUseCase', async () => {
    const { service, strategicPlan } = buildSut();
    const dto = { projectId: 'p1', objective: 'grow' } as never;
    await service.generateStrategicPlan('u1', 'OWNER' as never, dto);
    expect(strategicPlan.generatePlan).toHaveBeenCalledWith('u1', 'OWNER', dto);
  });

  it('delegates audit logs to AiAuditUseCase', async () => {
    const { service, audit } = buildSut();
    await service.getAiAuditLogs('u1', 'ADMIN' as never, 10, 7);
    expect(audit.getLogs).toHaveBeenCalledWith('u1', 'ADMIN', 10, 7);
  });
});
