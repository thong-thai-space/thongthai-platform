import { Inject, Injectable } from '@nestjs/common';
import {
  ARCHITECTURE_DIAGRAM_PROMPT,
  CLIENT_ASSISTANT_PROMPT,
  CODE_REVIEW_PROMPT,
  ESTIMATE_PROMPT,
  GENERAL_ASSISTANT_PROMPT,
  PROFESSIONAL_OUTPUT_RULES,
  PROGRESS_REPORT_PROMPT,
  PROPOSAL_PROMPT,
  PUBLIC_FAQ_PROMPT,
  STRATEGIC_PLAN_PROMPT,
  TASK_BREAKDOWN_PROMPT,
} from '../prompts';
import { AI_REPOSITORY } from '../ai.constants';
import type { AiRepositoryPort } from '../domain/ai.repository.port';

export interface AiPromptConfig {
  generalAssistant: string;
  clientAssistant: string;
  publicFaq: string;
  proposal: string;
  taskBreakdown: string;
  codeReview: string;
  estimate: string;
  progressReport: string;
  strategicPlan: string;
  architectureDiagram: string;
  professionalOutputRules: string;
}

// Pattern: Application Service — loads prompt overrides from CMS, falls back to defaults
@Injectable()
export class AiPromptConfigService {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly aiRepository: AiRepositoryPort,
  ) {}

  async get(): Promise<AiPromptConfig> {
    const defaults = this.defaults();
    const section = await this.aiRepository.findPromptSection();

    if (
      !section?.isActive ||
      !section.data ||
      typeof section.data !== 'object'
    ) {
      return defaults;
    }

    const data = section.data as Record<string, unknown>;
    return {
      generalAssistant: this.pick(
        data.generalAssistant,
        defaults.generalAssistant,
      ),
      clientAssistant: this.pick(
        data.clientAssistant,
        defaults.clientAssistant,
      ),
      publicFaq: this.pick(data.publicFaq, defaults.publicFaq),
      proposal: this.pick(data.proposal, defaults.proposal),
      taskBreakdown: this.pick(data.taskBreakdown, defaults.taskBreakdown),
      codeReview: this.pick(data.codeReview, defaults.codeReview),
      estimate: this.pick(data.estimate, defaults.estimate),
      progressReport: this.pick(data.progressReport, defaults.progressReport),
      strategicPlan: this.pick(data.strategicPlan, defaults.strategicPlan),
      architectureDiagram: this.pick(
        data.architectureDiagram,
        defaults.architectureDiagram,
      ),
      professionalOutputRules: this.pick(
        data.professionalOutputRules,
        defaults.professionalOutputRules,
      ),
    };
  }

  private defaults(): AiPromptConfig {
    return {
      generalAssistant: GENERAL_ASSISTANT_PROMPT,
      clientAssistant: CLIENT_ASSISTANT_PROMPT,
      publicFaq: PUBLIC_FAQ_PROMPT,
      proposal: PROPOSAL_PROMPT,
      taskBreakdown: TASK_BREAKDOWN_PROMPT,
      codeReview: CODE_REVIEW_PROMPT,
      estimate: ESTIMATE_PROMPT,
      progressReport: PROGRESS_REPORT_PROMPT,
      strategicPlan: STRATEGIC_PLAN_PROMPT,
      architectureDiagram: ARCHITECTURE_DIAGRAM_PROMPT,
      professionalOutputRules: PROFESSIONAL_OUTPUT_RULES,
    };
  }

  private pick(input: unknown, fallback: string): string {
    return typeof input === 'string' && input.trim().length > 0
      ? input
      : fallback;
  }
}
