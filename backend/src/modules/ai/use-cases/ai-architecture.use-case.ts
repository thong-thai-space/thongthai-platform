import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Resvg } from '@resvg/resvg-js';
import { AiFeature, UserRole } from '@prisma/client';
import { AI_PROVIDER_PORT, AI_REPOSITORY } from '../ai.constants';
import type { AiProviderPort } from '../domain/ai.provider.port';
import type { AiRepositoryPort } from '../domain/ai.repository.port';
import { AiPolicy } from '../policies/ai.policy';
import { FileParserService } from '../services/file-parser.service';
import { DocxGeneratorService } from '../services/docx-generator.service';
import { AiAuditService } from '../support/ai-audit.service';
import { AiPromptConfigService } from '../support/ai-prompt-config.service';
import {
  AI_MODEL,
  estimateCostUsd,
  isProviderUnavailableError,
  maskSensitiveData,
  roleDirective,
  tryParseJson,
} from '../support/ai-content.helpers';

interface ArchitectureAgentResult {
  description: string;
  layers: string[];
  svg: string;
}

const ARCHITECTURE_TRIAL_REQUEST_LIMIT = 4;

// Pattern: Use Case — architecture-diagram generation with fallback + DOCX export
@Injectable()
export class AiArchitectureUseCase {
  private readonly logger = new Logger(AiArchitectureUseCase.name);

  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repo: AiRepositoryPort,
    @Inject(AI_PROVIDER_PORT)
    private readonly provider: AiProviderPort,
    private readonly prompts: AiPromptConfigService,
    private readonly audit: AiAuditService,
    private readonly aiPolicy: AiPolicy,
    private readonly fileParser: FileParserService,
    private readonly docxGenerator: DocxGeneratorService,
  ) {}

  async execute(
    userId: string,
    role: UserRole,
    message: string,
    file?: Express.Multer.File,
  ) {
    const promptConfig = await this.prompts.get();
    const sanitizedMessage = maskSensitiveData(message);
    const startedAt = Date.now();

    try {
      await this.assertTrialLimit(userId);
      const parsedFile = await this.fileParser.parse(file);

      const userPrompt = [
        `User role: ${role}`,
        `Project requirements:\n${sanitizedMessage}`,
        ...(parsedFile.textContext ? [parsedFile.textContext] : []),
      ].join('\n\n');

      const { result, usage, fallbackUsed } = await this.generateOrFallback(
        userPrompt,
        promptConfig,
        role,
        sanitizedMessage,
      );

      if (!fallbackUsed) {
        await this.audit.consumeQuota(userId, usage.totalTokens);
      }

      const docxBuffer = await this.docxGenerator.generateArchitectureReport({
        title: 'System Architecture Report',
        description: result.description,
        svg: result.svg,
        generatedAt: new Date(),
      });

      const cost = fallbackUsed ? 0 : estimateCostUsd(usage.inputTokens, usage.outputTokens);

      await this.audit.log({
        feature: AiFeature.ARCHITECTURE_DIAGRAM,
        userId,
        model: AI_MODEL,
        success: true,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        estimatedCostUsd: cost,
        durationMs: Date.now() - startedAt,
        metadata: {
          hasFile: Boolean(file),
          mimeType: file?.mimetype,
          layers: result.layers,
          fallbackUsed,
        },
      });

      return {
        description: result.description,
        layers: result.layers,
        svg: result.svg,
        docxBase64: docxBuffer.toString('base64'),
        usage: {
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          estimatedCostUsd: Number(cost.toFixed(6)),
          fallbackUsed,
        },
      };
    } catch (error) {
      await this.audit.log({
        feature: AiFeature.ARCHITECTURE_DIAGRAM,
        userId,
        model: AI_MODEL,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: { hasFile: Boolean(file), mimeType: file?.mimetype },
      });

      if (
        error instanceof BadRequestException ||
        (error instanceof HttpException && error.getStatus() === HttpStatus.TOO_MANY_REQUESTS)
      ) {
        throw error;
      }

      this.logger.error(
        'Architecture diagram generation failed',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to generate architecture diagram');
    }
  }

  private async assertTrialLimit(userId: string): Promise<void> {
    const used = await this.repo.countUsageAudit({
      userId,
      feature: AiFeature.ARCHITECTURE_DIAGRAM,
      success: true,
    });
    this.aiPolicy.assertArchitectureTrialLimit(used, ARCHITECTURE_TRIAL_REQUEST_LIMIT);
  }

  private async generateOrFallback(
    userPrompt: string,
    promptConfig: { architectureDiagram: string; professionalOutputRules: string },
    role: UserRole,
    sanitizedMessage: string,
  ): Promise<{
    result: ArchitectureAgentResult;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
    fallbackUsed: boolean;
  }> {
    const systemPrompt =
      promptConfig.architectureDiagram +
      promptConfig.professionalOutputRules +
      roleDirective(role);

    let response: { text: string; usage: { inputTokens: number; outputTokens: number } } | null =
      null;

    try {
      response = await this.provider.createMessage({
        model: AI_MODEL,
        maxTokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
    } catch (providerError) {
      if (!isProviderUnavailableError(providerError)) throw providerError;
      return this.buildFallback(sanitizedMessage);
    }

    try {
      const parsed = this.parseResponse(response.text);
      return {
        result: parsed,
        usage: {
          inputTokens: response.usage.inputTokens,
          outputTokens: response.usage.outputTokens,
          totalTokens: response.usage.inputTokens + response.usage.outputTokens,
        },
        fallbackUsed: false,
      };
    } catch {
      // One retry with stricter instruction
      try {
        response = await this.provider.createMessage({
          model: AI_MODEL,
          maxTokens: 4096,
          system:
            promptConfig.architectureDiagram +
            '\n\nCorrection: Your previous output was invalid. Respond with valid JSON only and include a valid SVG with viewBox="0 0 900 600". Ensure labels are readable and arrows are present.',
          messages: [{ role: 'user', content: userPrompt }],
        });
        const parsed = this.parseResponse(response.text);
        return {
          result: parsed,
          usage: {
            inputTokens: response.usage.inputTokens,
            outputTokens: response.usage.outputTokens,
            totalTokens: response.usage.inputTokens + response.usage.outputTokens,
          },
          fallbackUsed: false,
        };
      } catch (retryError) {
        if (!isProviderUnavailableError(retryError)) {
          this.logger.warn(
            'Architecture output invalid after retry, falling back to template result',
          );
        }
        return this.buildFallback(sanitizedMessage);
      }
    }
  }

  private buildFallback(sanitizedMessage: string): {
    result: ArchitectureAgentResult;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
    fallbackUsed: boolean;
  } {
    return {
      result: this.buildFallbackResult(sanitizedMessage),
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      fallbackUsed: true,
    };
  }

  private parseResponse(content: string): ArchitectureAgentResult {
    const parsed = tryParseJson<ArchitectureAgentResult>(content);
    if ('raw' in parsed) {
      throw new BadRequestException('AI returned non-JSON architecture output');
    }

    const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';
    const layers = Array.isArray(parsed.layers)
      ? parsed.layers.filter((l) => typeof l === 'string').map((l) => l.trim())
      : [];
    const svgRaw = typeof parsed.svg === 'string' ? parsed.svg.trim() : '';
    const svg = this.sanitizeSvg(svgRaw);

    if (!description) throw new BadRequestException('Architecture description is missing');
    if (layers.length === 0) throw new BadRequestException('Architecture layers are missing');
    if (!svg.startsWith('<svg') || !svg.includes('viewBox="0 0 900 600"')) {
      throw new BadRequestException('Architecture SVG is invalid');
    }

    this.assertQuality(description, layers, svg);
    return { description, layers, svg };
  }

  private sanitizeSvg(svg: string): string {
    let s = svg
      .replace(/^\uFEFF/, '')
      .replace(/<\?xml[^>]*\?>/gi, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .trim();
    s = s.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
    return s;
  }

  private assertQuality(description: string, layers: string[], svg: string): void {
    const paragraphCount = description
      .split(/\n\s*\n/g)
      .map((x) => x.trim())
      .filter(Boolean).length;
    if (paragraphCount < 1 || description.length < 120) {
      throw new BadRequestException('Architecture description quality is too low');
    }
    if (layers.length < 3) {
      throw new BadRequestException('Architecture layers are insufficient');
    }

    const rectCount = (svg.match(/<rect\b/gi) || []).length;
    const textCount = (svg.match(/<text\b/gi) || []).length;
    const arrowCount = (svg.match(/marker-end=|<line\b/gi) || []).length;
    if (rectCount < 3 || textCount < 5 || arrowCount < 2) {
      throw new BadRequestException('Architecture SVG quality is too low');
    }

    if (
      /<script\b|<foreignObject\b|href="https?:\/\//i.test(svg) ||
      svg.length < 500 ||
      svg.length > 120_000
    ) {
      throw new BadRequestException('Architecture SVG contains unsafe or invalid markup');
    }

    try {
      new Resvg(svg, { fitTo: { mode: 'width', value: 900 } }).render();
    } catch {
      throw new BadRequestException('Architecture SVG is malformed and cannot be rendered');
    }
  }

  private buildFallbackResult(message: string): ArchitectureAgentResult {
    const summary = message.replace(/\s+/g, ' ').trim().slice(0, 340);

    const description =
      `Fallback architecture generated due to temporary AI provider unavailability.\n\n` +
      `The system is structured in layered modules to keep clear separation between user interface, API orchestration, domain logic, and persistent storage. This allows independent scaling and easier maintenance for project management workflows.\n\n` +
      `Core business capabilities include contract and delivery tracking, financial control, and partner integrations. Each domain is exposed through dedicated APIs and protected with authentication, authorization, and audit logging.\n\n` +
      `User requirement summary: ${summary || 'General business management requirements.'}`;

    const layers = [
      'Client Layer',
      'API Layer',
      'Business Logic Layer',
      'Data Layer',
      'External Integrations',
    ];

    const svg = `<svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e3f2fd"/><stop offset="100%" stop-color="#fff8e1"/></linearGradient><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#334155"/></marker></defs><rect x="0" y="0" width="900" height="600" fill="url(#bg)"/><rect x="60" y="50" width="780" height="90" rx="10" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/><text x="450" y="82" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#1e40af">CLIENT LAYER</text><text x="450" y="108" text-anchor="middle" font-family="Arial" font-size="12" fill="#334155">Web dashboard, client portal, architecture review UI</text><rect x="60" y="165" width="780" height="90" rx="10" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/><text x="450" y="197" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#166534">API LAYER</text><text x="450" y="223" text-anchor="middle" font-family="Arial" font-size="12" fill="#334155">Auth APIs, Project APIs, AI orchestration endpoints</text><rect x="60" y="280" width="780" height="90" rx="10" fill="#fff7ed" stroke="#ea580c" stroke-width="2"/><text x="450" y="312" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#9a3412">BUSINESS LOGIC LAYER</text><text x="450" y="338" text-anchor="middle" font-family="Arial" font-size="12" fill="#334155">Workflow engine, quota guard, architecture generation service</text><rect x="60" y="395" width="780" height="90" rx="10" fill="#f5f3ff" stroke="#7c3aed" stroke-width="2"/><text x="450" y="427" text-anchor="middle" font-family="Arial" font-size="18" font-weight="bold" fill="#5b21b6">DATA LAYER</text><text x="450" y="453" text-anchor="middle" font-family="Arial" font-size="12" fill="#334155">PostgreSQL (Prisma), audit logs, project/task/invoice data</text><rect x="60" y="510" width="780" height="60" rx="10" fill="#ecfeff" stroke="#0891b2" stroke-width="2"/><text x="450" y="537" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#0e7490">EXTERNAL INTEGRATIONS</text><text x="450" y="557" text-anchor="middle" font-family="Arial" font-size="12" fill="#334155">Anthropic API, Email provider, OAuth, ERP/Payment/Delivery APIs</text><line x1="450" y1="140" x2="450" y2="165" stroke="#334155" stroke-width="2" marker-end="url(#arrow)"/><line x1="450" y1="255" x2="450" y2="280" stroke="#334155" stroke-width="2" marker-end="url(#arrow)"/><line x1="450" y1="370" x2="450" y2="395" stroke="#334155" stroke-width="2" marker-end="url(#arrow)"/><line x1="450" y1="485" x2="450" y2="510" stroke="#334155" stroke-width="2" marker-end="url(#arrow)"/></svg>`;

    return { description, layers, svg };
  }
}
