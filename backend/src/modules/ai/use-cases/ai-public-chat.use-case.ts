import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiFeature } from '@prisma/client';
import { AI_PROVIDER_PORT, AI_REPOSITORY } from '../ai.constants';
import type { AiProviderPort } from '../domain/ai.provider.port';
import type { AiRepositoryPort } from '../domain/ai.repository.port';
import { AiAuditService } from '../support/ai-audit.service';
import { AiPromptConfigService } from '../support/ai-prompt-config.service';
import {
  AI_MODEL,
  estimateCostUsd,
  maskSensitiveData,
} from '../support/ai-content.helpers';

interface PublicBrandContext {
  services: string[];
  aboutSummary: string;
  founderProfile: string;
  showcaseProjects: Array<{
    name: string;
    category: string;
    techStack: string[];
    results: string;
  }>;
}

// Pattern: Use Case — anonymous public-facing chat grounded in CMS brand context
@Injectable()
export class AiPublicChatUseCase {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repo: AiRepositoryPort,
    @Inject(AI_PROVIDER_PORT)
    private readonly provider: AiProviderPort,
    private readonly prompts: AiPromptConfigService,
    private readonly audit: AiAuditService,
    private readonly configService: ConfigService,
  ) {}

  async execute(message: string) {
    const startedAt = Date.now();
    const sanitizedMessage = maskSensitiveData(message);

    try {
      const promptConfig = await this.prompts.get();
      const brandContext = await this.buildBrandContext();
      const publicContext = this.toContextText(brandContext);

      const response = await this.provider.createMessage({
        model: AI_MODEL,
        maxTokens: 1024,
        system:
          promptConfig.publicFaq +
          promptConfig.professionalOutputRules +
          `\n\n${publicContext}`,
        messages: [{ role: 'user', content: sanitizedMessage }],
      });

      await this.audit.log({
        feature: AiFeature.PUBLIC_CHAT,
        model: AI_MODEL,
        success: true,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.inputTokens + response.usage.outputTokens,
        estimatedCostUsd: estimateCostUsd(
          response.usage.inputTokens,
          response.usage.outputTokens,
        ),
        durationMs: Date.now() - startedAt,
      });

      return { message: response.text };
    } catch (error) {
      await this.audit.log({
        feature: AiFeature.PUBLIC_CHAT,
        model: AI_MODEL,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }

  private async buildBrandContext(): Promise<PublicBrandContext> {
    const { siteContents, showcaseProjects } = await this.repo.findPublicBrandContextData();

    const getSectionData = (section: string) =>
      siteContents.find((x) => x.section === section)?.data as
        | Record<string, unknown>
        | undefined;

    const aboutData = getSectionData('about') || {};
    const servicesData = getSectionData('services') || {};
    const founderData = getSectionData('founder-profile') || getSectionData('founder_cv') || {};

    const services = Array.isArray(servicesData['items'])
      ? (servicesData['items'] as Array<Record<string, unknown>>)
          .map((x) => String(x.title || x.name || '').trim())
          .filter(Boolean)
      : [];

    const aboutSummary = String(
      aboutData['summary'] || aboutData['description'] || aboutData['mission'] || '',
    ).trim();

    const founderProfileFromEnv = String(
      this.configService.get<string>('FOUNDER_CV_PROFILE') ||
        this.configService.get<string>('NGUYEN_HOANG_THAI_CV_PROFILE') ||
        '',
    ).trim();

    const founderProfile = String(
      founderData['summary'] ||
        founderData['bio'] ||
        founderData['overview'] ||
        founderProfileFromEnv ||
        '',
    ).trim();

    return {
      services,
      aboutSummary,
      founderProfile,
      showcaseProjects: showcaseProjects.map((p) => ({
        name: p.name,
        category: p.showcaseCategory || 'General',
        techStack: p.techStack || [],
        results: p.showcaseResults || '',
      })),
    };
  }

  private toContextText(context: PublicBrandContext): string {
    return [
      'VERIFIED BRAND CONTEXT (REAL DATA):',
      `- About: ${context.aboutSummary || 'Not available'}`,
      `- Founder profile (Nguyen Hoang Thai): ${
        context.founderProfile || 'Not available in DB. Do not fabricate.'
      }`,
      `- Services: ${context.services.length ? context.services.join(', ') : 'Not available'}`,
      `- Portfolio projects: ${
        context.showcaseProjects.length
          ? context.showcaseProjects
              .map(
                (p) =>
                  `${p.name} [${p.category}] | Tech: ${p.techStack.join(', ') || 'N/A'} | Results: ${
                    p.results || 'N/A'
                  }`,
              )
              .join(' || ')
          : 'Not available'
      }`,
      '',
      'GROUNDING RULES:',
      '- Only use VERIFIED BRAND CONTEXT for company identity/capabilities.',
      '- If founder profile is missing, explicitly say it is unavailable and ask user to provide/update profile data.',
      '- Never invent achievements, clients, or founder background.',
    ].join('\n');
  }
}
