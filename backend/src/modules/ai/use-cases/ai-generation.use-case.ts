import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AiFeature, Language, UserRole } from '@prisma/client';
import { AI_PROVIDER_PORT, AI_REPOSITORY } from '../ai.constants';
import type { AiProviderPort } from '../domain/ai.provider.port';
import type { AiRepositoryPort } from '../domain/ai.repository.port';
import { AiAuditService } from '../support/ai-audit.service';
import { AiPromptConfigService } from '../support/ai-prompt-config.service';
import {
  AI_MODEL,
  estimateCostUsd,
  maskSensitiveData,
  roleDirective,
  tryParseJson,
} from '../support/ai-content.helpers';

// Pattern: Use Case — single-shot AI generations (proposal, estimate, code review, etc.)
@Injectable()
export class AiGenerationUseCase {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repo: AiRepositoryPort,
    @Inject(AI_PROVIDER_PORT)
    private readonly provider: AiProviderPort,
    private readonly prompts: AiPromptConfigService,
    private readonly audit: AiAuditService,
  ) {}

  async generateProposal(
    userId: string,
    role: UserRole,
    clientRequirements: string,
    locale: Language = Language.VI,
    budget?: string,
  ): Promise<string> {
    const promptConfig = await this.prompts.get();
    const langNote =
      locale === Language.EN
        ? '\n\nPlease write the proposal in English.'
        : '\n\nHay viet proposal bang tieng Viet.';

    return this.runWithAudit({
      feature: AiFeature.PROPOSAL,
      userId,
      metadata: { locale },
      runner: () =>
        this.provider.createMessage({
          model: AI_MODEL,
          maxTokens: 4096,
          system:
            promptConfig.proposal +
            promptConfig.professionalOutputRules +
            roleDirective(role) +
            langNote,
          messages: [
            {
              role: 'user',
              content: `Client requirements:\n${maskSensitiveData(
                clientRequirements,
              )}\n\nBudget: ${budget || 'Not specified'}`,
            },
          ],
        }),
      mapResponse: (r) => r.text,
    });
  }

  async breakdownTasks(
    userId: string,
    role: UserRole,
    projectDescription: string,
    techStack: string[],
  ): Promise<unknown> {
    const promptConfig = await this.prompts.get();

    return this.runWithAudit({
      feature: AiFeature.TASK_BREAKDOWN,
      userId,
      runner: () =>
        this.provider.createMessage({
          model: AI_MODEL,
          maxTokens: 4096,
          system:
            promptConfig.taskBreakdown +
            promptConfig.professionalOutputRules +
            roleDirective(role),
          messages: [
            {
              role: 'user',
              content: `Project: ${maskSensitiveData(projectDescription)}\nTech Stack: ${techStack.join(', ')}`,
            },
          ],
        }),
      mapResponse: (r) => tryParseJson(r.text),
    });
  }

  async reviewCode(
    userId: string,
    role: UserRole,
    code: string,
    language: string,
    context?: string,
  ): Promise<string> {
    const promptConfig = await this.prompts.get();

    return this.runWithAudit({
      feature: AiFeature.CODE_REVIEW,
      userId,
      metadata: { language },
      runner: () =>
        this.provider.createMessage({
          model: AI_MODEL,
          maxTokens: 4096,
          system:
            promptConfig.codeReview +
            promptConfig.professionalOutputRules +
            roleDirective(role),
          messages: [
            {
              role: 'user',
              content: `Language: ${language}\nContext: ${context || 'General'}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
            },
          ],
        }),
      mapResponse: (r) => r.text,
    });
  }

  async estimateProject(
    userId: string,
    role: UserRole,
    requirements: string,
    locale: Language = Language.VI,
  ): Promise<unknown> {
    const promptConfig = await this.prompts.get();
    const langNote =
      locale === Language.EN
        ? '\n\nRespond in English.'
        : '\n\nTra loi bang tieng Viet.';

    return this.runWithAudit({
      feature: AiFeature.ESTIMATE,
      userId,
      metadata: { locale },
      runner: () =>
        this.provider.createMessage({
          model: AI_MODEL,
          maxTokens: 2048,
          system:
            promptConfig.estimate +
            promptConfig.professionalOutputRules +
            roleDirective(role) +
            langNote,
          messages: [
            { role: 'user', content: maskSensitiveData(requirements) },
          ],
        }),
      mapResponse: (r) => tryParseJson(r.text),
    });
  }

  async generateProgressReport(
    userId: string,
    role: UserRole,
    projectId: string,
    locale: Language = Language.VI,
  ): Promise<string> {
    const promptConfig = await this.prompts.get();
    const project = await this.repo.findProjectForProgressReport(projectId);
    if (!project) throw new NotFoundException('Project not found');

    const taskSummary = {
      total: project.tasks.length,
      done: project.tasks.filter((t) => t.status === 'DONE').length,
      inProgress: project.tasks.filter((t) => t.status === 'IN_PROGRESS')
        .length,
      blocked: project.tasks.filter((t) => t.status === 'BLOCKED').length,
    };

    const langNote =
      locale === Language.EN
        ? '\n\nWrite the report in English.'
        : '\n\nViet bao cao bang tieng Viet.';

    return this.runWithAudit({
      feature: AiFeature.PROGRESS_REPORT,
      userId,
      projectId,
      metadata: { locale },
      runner: () =>
        this.provider.createMessage({
          model: AI_MODEL,
          maxTokens: 2048,
          system:
            promptConfig.progressReport +
            promptConfig.professionalOutputRules +
            roleDirective(role) +
            langNote,
          messages: [
            {
              role: 'user',
              content: `Project: ${project.name}\nStatus: ${project.status}\nTask Summary: ${JSON.stringify(taskSummary)}\nMilestones: ${JSON.stringify(project.milestones)}`,
            },
          ],
        }),
      mapResponse: (r) => r.text,
    });
  }

  // Pattern: Template Method — common audit-wrap shared by every single-shot generation
  private async runWithAudit<T>(opts: {
    feature: AiFeature;
    userId: string;
    projectId?: string;
    metadata?: unknown;
    runner: () => Promise<{
      text: string;
      usage: { inputTokens: number; outputTokens: number };
    }>;
    mapResponse: (response: { text: string }) => T;
  }): Promise<T> {
    const startedAt = Date.now();
    try {
      const response = await opts.runner();
      const totalTokens =
        response.usage.inputTokens + response.usage.outputTokens;

      await this.audit.log({
        feature: opts.feature,
        userId: opts.userId,
        projectId: opts.projectId,
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
        metadata: opts.metadata,
      });

      return opts.mapResponse(response);
    } catch (error) {
      await this.audit.log({
        feature: opts.feature,
        userId: opts.userId,
        projectId: opts.projectId,
        model: AI_MODEL,
        success: false,
        errorMessage:
          error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: opts.metadata,
      });
      throw error;
    }
  }
}
