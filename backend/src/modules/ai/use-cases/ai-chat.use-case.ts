import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AiFeature, UserRole } from '@prisma/client';
import { AI_PROVIDER_PORT, AI_REPOSITORY } from '../ai.constants';
import type {
  AiMessageParam,
  AiProviderPort,
} from '../domain/ai.provider.port';
import type { AiRepositoryPort } from '../domain/ai.repository.port';
import { AiAuditService } from '../support/ai-audit.service';
import { AiPromptConfigService } from '../support/ai-prompt-config.service';
import {
  AI_MODEL,
  estimateCostUsd,
  maskSensitiveData,
  roleDirective,
} from '../support/ai-content.helpers';

// Pattern: Use Case — internal AI chat for authenticated users (project-aware)
@Injectable()
export class AiChatUseCase {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repo: AiRepositoryPort,
    @Inject(AI_PROVIDER_PORT)
    private readonly provider: AiProviderPort,
    private readonly prompts: AiPromptConfigService,
    private readonly audit: AiAuditService,
  ) {}

  async execute(
    userId: string,
    message: string,
    conversationId?: string,
    role?: UserRole,
  ) {
    const promptConfig = await this.prompts.get();
    const sanitizedMessage = maskSensitiveData(message);

    const conversation = await this.resolveConversation(
      userId,
      message,
      conversationId,
    );

    await this.repo.createMessage({
      conversationId: conversation.id,
      role: 'user',
      content: sanitizedMessage,
    });

    const messages: AiMessageParam[] = conversation.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    messages.push({ role: 'user', content: sanitizedMessage });

    const [projects, snapshot] = await Promise.all([
      this.repo.findProjectsForChatContext(userId, role),
      this.repo.getOperationalSnapshot(userId, role),
    ]);

    const systemPrompt = this.buildSystemPrompt(
      role,
      promptConfig,
      projects,
      snapshot,
    );
    const startedAt = Date.now();

    try {
      const response = await this.provider.createMessage({
        model: AI_MODEL,
        maxTokens: 4096,
        system: systemPrompt,
        messages,
      });

      const totalTokens =
        response.usage.inputTokens + response.usage.outputTokens;
      await this.repo.createMessage({
        conversationId: conversation.id,
        role: 'assistant',
        content: response.text,
        tokenUsage: totalTokens,
      });

      await this.audit.log({
        feature: AiFeature.CHAT,
        userId,
        model: AI_MODEL,
        success: true,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens,
        estimatedCostUsd: estimateCostUsd(
          response.usage.inputTokens,
          response.usage.outputTokens,
        ),
        durationMs: Date.now() - startedAt,
        metadata: { conversationId: conversation.id, role },
      });

      return {
        conversationId: conversation.id,
        message: response.text,
        usage: {
          input_tokens: response.usage.inputTokens,
          output_tokens: response.usage.outputTokens,
        },
      };
    } catch (error) {
      await this.audit.log({
        feature: AiFeature.CHAT,
        userId,
        model: AI_MODEL,
        success: false,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: { conversationId: conversation.id, role },
      });
      throw error;
    }
  }

  private async resolveConversation(
    userId: string,
    message: string,
    conversationId?: string,
  ) {
    if (conversationId) {
      const found = await this.repo.findConversationWithMessages(
        conversationId,
        userId,
      );
      if (!found)
        throw new ForbiddenException('Conversation not found or access denied');
      return found;
    }
    return this.repo.createConversation(userId, message.substring(0, 100));
  }

  private buildSystemPrompt(
    role: UserRole | undefined,
    promptConfig: {
      generalAssistant: string;
      clientAssistant: string;
      professionalOutputRules: string;
    },
    projects: Array<{
      name: string;
      status: string;
      description: string | null;
      techStack: string[];
      budget: number | null;
      currency: string | null;
      _count: { tasks: number };
    }>,
    snapshot: unknown,
  ): string {
    const projectContext = projects.length
      ? `\n\nCOMPANY PROJECTS (current data from database):\n${projects
          .map(
            (p) =>
              `- ${p.name} [${p.status}]: ${p.description || 'No description'}. Tech: ${
                Array.isArray(p.techStack) ? p.techStack.join(', ') : 'N/A'
              }. Budget: ${p.budget ? `${p.budget} ${p.currency}` : 'N/A'}. Tasks: ${p._count.tasks}`,
          )
          .join('\n')}`
      : '';

    const operationsContext = `\n\nSYSTEM OPERATIONAL SNAPSHOT (live DB):\n${JSON.stringify(snapshot)}`;

    const accessDirective =
      `\n\nACCESS DIRECTIVE:\n` +
      `- You DO have direct access to current system data via the provided snapshots.\n` +
      `- Do NOT claim you cannot access the system/database when snapshot data exists.\n` +
      `- If user asks for KPI report, answer with exact numbers from snapshots first, then recommendations.`;

    const base =
      role === UserRole.CLIENT
        ? promptConfig.clientAssistant
        : promptConfig.generalAssistant;

    return (
      base +
      promptConfig.professionalOutputRules +
      roleDirective(role) +
      projectContext +
      operationsContext +
      accessDirective
    );
  }
}
