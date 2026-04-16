import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import Anthropic from '@anthropic-ai/sdk';
import { Resvg } from '@resvg/resvg-js';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AiFeature,
  Language,
  Prisma,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  UserRole,
} from '@prisma/client';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';
import {
  AiAuditFeedbackDto,
  ApplyStrategicPlanDto,
  StrategicPlanDto,
} from './dto/ai.dto';
import {
  CODE_REVIEW_PROMPT,
  PROPOSAL_PROMPT,
  TASK_BREAKDOWN_PROMPT,
  GENERAL_ASSISTANT_PROMPT,
  CLIENT_ASSISTANT_PROMPT,
  PUBLIC_FAQ_PROMPT,
  ESTIMATE_PROMPT,
  PROGRESS_REPORT_PROMPT,
  PROFESSIONAL_OUTPUT_RULES,
  STRATEGIC_PLAN_PROMPT,
  ROLE_PROMPT_MAP,
  ARCHITECTURE_DIAGRAM_PROMPT,
} from './prompts';
import { FileParserService } from './services/file-parser.service';
import { DocxGeneratorService } from './services/docx-generator.service';

interface ArchitectureAgentResult {
  description: string;
  layers: string[];
  svg: string;
}

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

@Injectable()
export class AiService {
  private static readonly ARCHITECTURE_TRIAL_REQUEST_LIMIT = 4;
  private client: Anthropic;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private fileParserService: FileParserService,
    private docxGeneratorService: DocxGeneratorService,
  ) {
    this.client = new Anthropic({
      apiKey: this.configService.getOrThrow('ANTHROPIC_API_KEY'),
    });
  }

  private extractText(response: Anthropic.Messages.Message) {
    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  private tryParseJson<T = unknown>(content: string): T | { raw: string } {
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;
      return JSON.parse(content) as T;
    } catch {
      return { raw: content };
    }
  }

  private estimateCostUsd(inputTokens = 0, outputTokens = 0) {
    // Approximate Claude Sonnet cost: $3/M input tokens, $15/M output tokens.
    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;
    return inputCost + outputCost;
  }

  private async logAiAudit(data: {
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
  }) {
    try {
      await this.prisma.aiUsageAudit.create({
        data: {
          feature: data.feature,
          userId: data.userId,
          projectId: data.projectId,
          model: data.model,
          success: data.success,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalTokens: data.totalTokens,
          estimatedCostUsd:
            data.estimatedCostUsd !== undefined
              ? new Prisma.Decimal(data.estimatedCostUsd.toFixed(6))
              : undefined,
          durationMs: data.durationMs,
          errorMessage: data.errorMessage,
          metadata: data.metadata as Prisma.InputJsonValue | undefined,
        },
      });
    } catch {
      // Never block AI response due to audit logging issues.
    }
  }

  private roleDirective(role?: UserRole) {
    if (!role) return '';
    return ROLE_PROMPT_MAP[role] || '';
  }

  private toTaskPriority(impact?: string): TaskPriority {
    if (impact === 'HIGH') return 'HIGH';
    if (impact === 'LOW') return 'LOW';
    return 'MEDIUM';
  }

  private maskSensitiveData(input: string) {
    return input
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
      .replace(/\b(?:\+?84|0)(?:\d[\s.-]?){8,10}\b/g, '[PHONE]')
      .replace(/\b\d{9,16}\b/g, '[ID]');
  }

  private async consumeAiQuota(userId: string, totalTokens: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        aiQuotaUsedTokens: true,
        aiQuotaLimitTokens: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.aiQuotaUsedTokens + totalTokens > user.aiQuotaLimitTokens) {
      throw new HttpException('AI quota exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        aiQuotaUsedTokens: {
          increment: totalTokens,
        },
      },
    });
  }

  private parseArchitectureResponse(content: string): ArchitectureAgentResult {
    const parsed = this.tryParseJson<ArchitectureAgentResult>(content);

    if ('raw' in parsed) {
      throw new BadRequestException('AI returned non-JSON architecture output');
    }

    const description = typeof parsed.description === 'string' ? parsed.description.trim() : '';
    const layers = Array.isArray(parsed.layers)
      ? parsed.layers.filter((layer) => typeof layer === 'string').map((layer) => layer.trim())
      : [];
    const svgRaw = typeof parsed.svg === 'string' ? parsed.svg.trim() : '';
    const svg = this.sanitizeArchitectureSvg(svgRaw);

    if (!description) {
      throw new BadRequestException('Architecture description is missing');
    }

    if (layers.length === 0) {
      throw new BadRequestException('Architecture layers are missing');
    }

    if (!svg.startsWith('<svg') || !svg.includes('viewBox="0 0 900 600"')) {
      throw new BadRequestException('Architecture SVG is invalid');
    }

    this.validateArchitectureQuality(description, layers, svg);

    return { description, layers, svg };
  }

  private sanitizeArchitectureSvg(svg: string) {
    // Normalize XML head and remove null bytes/control chars.
    let sanitized = svg
      .replace(/^\uFEFF/, '')
      .replace(/<\?xml[^>]*\?>/gi, '')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
      .trim();

    // Escape bare ampersands that break XML parser.
    sanitized = sanitized.replace(
      /&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g,
      '&amp;',
    );

    return sanitized;
  }

  private validateArchitectureQuality(
    description: string,
    layers: string[],
    svg: string,
  ) {
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

    // Validate final SVG parse/render to prevent malformed XML from reaching UI.
    try {
      const resvg = new Resvg(svg, {
        fitTo: { mode: 'width', value: 900 },
      });
      resvg.render();
    } catch {
      throw new BadRequestException('Architecture SVG is malformed and cannot be rendered');
    }
  }

  private isProviderUnavailableError(error: unknown) {
    if (!error || typeof error !== 'object') return false;

    const anyError = error as {
      status?: number;
      statusCode?: number;
      code?: string;
      message?: string;
    };

    const status = anyError.status ?? anyError.statusCode;
    if (status === 429 || (typeof status === 'number' && status >= 500)) {
      return true;
    }

    const code = String(anyError.code || '').toUpperCase();
    if (['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED'].includes(code)) {
      return true;
    }

    const message = String(anyError.message || '').toLowerCase();
    return /timeout|network|socket|temporarily unavailable|overloaded|rate limit/.test(message);
  }

  private buildFallbackArchitectureResult(message: string): ArchitectureAgentResult {
    const summary = message
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 340);

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

  private async ensureArchitectureTrialLimit(userId: string) {
    const usedRequests = await this.prisma.aiUsageAudit.count({
      where: {
        userId,
        feature: AiFeature.ARCHITECTURE_DIAGRAM,
        success: true,
      },
    });

    if (usedRequests >= AiService.ARCHITECTURE_TRIAL_REQUEST_LIMIT) {
      throw new HttpException(
        `Trial limit reached: maximum ${AiService.ARCHITECTURE_TRIAL_REQUEST_LIMIT} requests`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async generateArchitectureDiagram(
    userId: string,
    role: UserRole,
    message: string,
    file?: Express.Multer.File,
  ) {
    const sanitizedMessage = this.maskSensitiveData(message);
    const startedAt = Date.now();

    try {
      await this.ensureArchitectureTrialLimit(userId);

      const parsedFile = await this.fileParserService.parse(file);

      const userPromptParts = [
        `User role: ${role}`,
        `Project requirements:\n${sanitizedMessage}`,
      ];

      if (parsedFile.textContext) {
        userPromptParts.push(parsedFile.textContext);
      }

      const userPrompt = userPromptParts.join('\n\n');

          let parsed: ArchitectureAgentResult | null = null;
      let inputTokens = 0;
      let outputTokens = 0;
      let totalTokens = 0;
      let fallbackUsed = false;

      let response: Anthropic.Messages.Message;
      try {
        response = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          system:
            ARCHITECTURE_DIAGRAM_PROMPT +
            PROFESSIONAL_OUTPUT_RULES +
            this.roleDirective(role),
          messages: [{ role: 'user', content: userPrompt }],
        });
      } catch (providerError) {
        if (!this.isProviderUnavailableError(providerError)) {
          throw providerError;
        }
        parsed = this.buildFallbackArchitectureResult(sanitizedMessage);
        fallbackUsed = true;
      }

      if (!fallbackUsed) {
        try {
          parsed = this.parseArchitectureResponse(this.extractText(response!));
        } catch {
          try {
            response = await this.client.messages.create({
              model: 'claude-sonnet-4-20250514',
              max_tokens: 4096,
              system:
                ARCHITECTURE_DIAGRAM_PROMPT +
                '\n\nCorrection: Your previous output was invalid. Respond with valid JSON only and include a valid SVG with viewBox="0 0 900 600". Ensure labels are readable and arrows are present.',
              messages: [{ role: 'user', content: userPrompt }],
            });

            parsed = this.parseArchitectureResponse(this.extractText(response));
          } catch (retryError) {
            if (retryError instanceof BadRequestException) {
              throw retryError;
            }

            if (!this.isProviderUnavailableError(retryError)) {
              throw new BadRequestException(
                'AI returned invalid architecture output. Please refine your request and try again.',
              );
            }

            parsed = this.buildFallbackArchitectureResult(sanitizedMessage);
            fallbackUsed = true;
          }
        }
      }

      if (!fallbackUsed) {
        inputTokens = response!.usage.input_tokens;
        outputTokens = response!.usage.output_tokens;
        totalTokens = inputTokens + outputTokens;
      }

      if (!fallbackUsed) {
        await this.consumeAiQuota(userId, totalTokens);
      }

      if (!parsed) {
        throw new InternalServerErrorException('Architecture result is empty');
      }

      const docxBuffer = await this.docxGeneratorService.generateArchitectureReport({
        title: 'System Architecture Report',
        description: parsed.description,
        svg: parsed.svg,
        generatedAt: new Date(),
      });

      const estimatedCostUsd = fallbackUsed ? 0 : this.estimateCostUsd(inputTokens, outputTokens);

      await this.logAiAudit({
        feature: AiFeature.ARCHITECTURE_DIAGRAM,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: true,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCostUsd,
        durationMs: Date.now() - startedAt,
        metadata: {
          hasFile: Boolean(file),
          mimeType: file?.mimetype,
          layers: parsed.layers,
          fallbackUsed,
        },
      });

      return {
        description: parsed.description,
        layers: parsed.layers,
        svg: parsed.svg,
        docxBase64: docxBuffer.toString('base64'),
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
          fallbackUsed,
        },
      };
    } catch (error) {
      await this.logAiAudit({
        feature: AiFeature.ARCHITECTURE_DIAGRAM,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: {
          hasFile: Boolean(file),
          mimeType: file?.mimetype,
        },
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

  private async buildOperationalSnapshot(userId: string, userRole?: UserRole) {
    // Client role only sees their own operational metrics.
    if (userRole === UserRole.CLIENT) {
      const [clientProjects, clientTasksInProgress] = await this.prisma.$transaction([
        this.prisma.project.count({
          where: {
            clientId: userId,
            status: {
              in: [
                ProjectStatus.PROPOSAL_SENT,
                ProjectStatus.IN_PROGRESS,
                ProjectStatus.ON_HOLD,
                ProjectStatus.REVIEW,
              ],
            },
          },
        }),
        this.prisma.task.count({
          where: {
            project: { clientId: userId },
            status: {
              in: [
                TaskStatus.TODO,
                TaskStatus.IN_PROGRESS,
                TaskStatus.IN_REVIEW,
                TaskStatus.BLOCKED,
              ],
            },
          },
        }),
      ]);

      return {
        scope: 'CLIENT_ONLY',
        generatedAt: new Date().toISOString(),
        teamMembers: null,
        activeClients: null,
        projectsInProgress: clientProjects,
        tasksInProgress: clientTasksInProgress,
      };
    }

    const [teamMembers, activeClients, projectsInProgress, tasksInProgress] =
      await this.prisma.$transaction([
        this.prisma.user.count({
          where: {
            isActive: true,
            role: { in: [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER] },
          },
        }),
        this.prisma.user.count({
          where: {
            isActive: true,
            role: UserRole.CLIENT,
          },
        }),
        this.prisma.project.count({
          where: {
            status: {
              in: [
                ProjectStatus.PROPOSAL_SENT,
                ProjectStatus.IN_PROGRESS,
                ProjectStatus.ON_HOLD,
                ProjectStatus.REVIEW,
              ],
            },
          },
        }),
        this.prisma.task.count({
          where: {
            status: {
              in: [
                TaskStatus.TODO,
                TaskStatus.IN_PROGRESS,
                TaskStatus.IN_REVIEW,
                TaskStatus.BLOCKED,
              ],
            },
          },
        }),
      ]);

    return {
      scope: 'INTERNAL',
      generatedAt: new Date().toISOString(),
      teamMembers,
      activeClients,
      projectsInProgress,
      tasksInProgress,
    };
  }

  // ==================== CHAT ====================

  async chat(userId: string, message: string, conversationId?: string, userRole?: UserRole) {
    const sanitizedMessage = this.maskSensitiveData(message);

    let conversation = null;

    if (conversationId) {
      conversation = await this.prisma.aiConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } },
      });

      if (!conversation) {
        throw new ForbiddenException('Conversation not found or access denied');
      }
    }

    if (!conversation) {
      conversation = await this.prisma.aiConversation.create({
        data: { userId, title: message.substring(0, 100) },
        include: { messages: true },
      });
    }

    // Save user message
    await this.prisma.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: sanitizedMessage,
      },
    });

    // Build message history
    const messages: Anthropic.MessageParam[] = conversation.messages.map(
      (m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }),
    );
    messages.push({ role: 'user', content: sanitizedMessage });

    // Build dynamic system prompt with project + operational context
    const projectWhere = userRole === 'CLIENT' ? { clientId: userId } : {};
    const projects = await this.prisma.project.findMany({
      where: projectWhere,
      select: {
        name: true,
        status: true,
        description: true,
        techStack: true,
        budget: true,
        currency: true,
        _count: { select: { tasks: true } },
      },
      take: 10,
      orderBy: { updatedAt: 'desc' },
    });

    const operationalSnapshot = await this.buildOperationalSnapshot(userId, userRole);

    const projectContext = projects.length
      ? `\n\nCOMPANY PROJECTS (current data from database):\n${projects
          .map(
            (p) =>
              `- ${p.name} [${p.status}]: ${p.description || 'No description'}. Tech: ${Array.isArray(p.techStack) ? p.techStack.join(', ') : 'N/A'}. Budget: ${p.budget ? `${String(p.budget)} ${p.currency}` : 'N/A'}. Tasks: ${p._count.tasks}`,
          )
          .join('\n')}`
      : '';

    const operationsContext = `\n\nSYSTEM OPERATIONAL SNAPSHOT (live DB):\n${JSON.stringify(
      operationalSnapshot,
    )}`;

    const accessDirective = `\n\nACCESS DIRECTIVE:\n- You DO have direct access to current system data via the provided snapshots.\n- Do NOT claim you cannot access the system/database when snapshot data exists.\n- If user asks for KPI report, answer with exact numbers from snapshots first, then recommendations.`;

    const systemPrompt =
      (userRole === 'CLIENT' ? CLIENT_ASSISTANT_PROMPT : GENERAL_ASSISTANT_PROMPT) +
      PROFESSIONAL_OUTPUT_RULES +
      this.roleDirective(userRole) +
      projectContext +
      operationsContext +
      accessDirective;

    const startedAt = Date.now();

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      });

      const assistantMessage = this.extractText(response);
      const totalTokens = response.usage.input_tokens + response.usage.output_tokens;

      await this.prisma.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: assistantMessage,
          tokenUsage: totalTokens,
        },
      });

      await this.logAiAudit({
        feature: AiFeature.CHAT,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: true,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens,
        estimatedCostUsd: this.estimateCostUsd(
          response.usage.input_tokens,
          response.usage.output_tokens,
        ),
        durationMs: Date.now() - startedAt,
        metadata: {
          conversationId: conversation.id,
          role: userRole,
        },
      });

      return {
        conversationId: conversation.id,
        message: assistantMessage,
        usage: response.usage,
      };
    } catch (error) {
      await this.logAiAudit({
        feature: AiFeature.CHAT,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: {
          conversationId: conversation.id,
          role: userRole,
        },
      });
      throw error;
    }
  }

  // ==================== SMART FEATURES ====================

  async generateProposal(
    userId: string,
    role: UserRole,
    clientRequirements: string,
    locale: Language = Language.VI,
    budget?: string,
  ) {
    const langNote =
      locale === Language.EN
        ? '\n\nPlease write the proposal in English.'
        : '\n\nHãy viết proposal bằng tiếng Việt.';

    const startedAt = Date.now();

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system:
          PROPOSAL_PROMPT + PROFESSIONAL_OUTPUT_RULES + this.roleDirective(role) + langNote,
        messages: [
          {
            role: 'user',
            content: `Client requirements:\n${this.maskSensitiveData(clientRequirements)}\n\nBudget: ${budget || 'Not specified'}`,
          },
        ],
      });

      await this.logAiAudit({
        feature: AiFeature.PROPOSAL,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: true,
        inputTokens: response.usage.input_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        estimatedCostUsd: this.estimateCostUsd(
          response.usage.input_tokens,
          response.usage.output_tokens,
        ),
        durationMs: Date.now() - startedAt,
        metadata: { locale },
      });

      return this.extractText(response);
    } catch (error) {
      await this.logAiAudit({
        feature: AiFeature.PROPOSAL,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: { locale },
      });
      throw error;
    }
  }

  async breakdownTasks(
    userId: string,
    role: UserRole,
    projectDescription: string,
    techStack: string[],
  ) {
    const startedAt = Date.now();

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: TASK_BREAKDOWN_PROMPT + PROFESSIONAL_OUTPUT_RULES + this.roleDirective(role),
        messages: [
          {
            role: 'user',
            content: `Project: ${this.maskSensitiveData(projectDescription)}\nTech Stack: ${techStack.join(', ')}`,
          },
        ],
      });

      await this.logAiAudit({
        feature: AiFeature.TASK_BREAKDOWN,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: true,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        estimatedCostUsd: this.estimateCostUsd(
          response.usage.input_tokens,
          response.usage.output_tokens,
        ),
        durationMs: Date.now() - startedAt,
      });

      const content = this.extractText(response);
      return this.tryParseJson(content);
    } catch (error) {
      await this.logAiAudit({
        feature: AiFeature.TASK_BREAKDOWN,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }

  async reviewCode(
    userId: string,
    role: UserRole,
    code: string,
    language: string,
    context?: string,
  ) {
    const startedAt = Date.now();

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: CODE_REVIEW_PROMPT + PROFESSIONAL_OUTPUT_RULES + this.roleDirective(role),
        messages: [
          {
            role: 'user',
            content: `Language: ${language}\nContext: ${context || 'General'}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
          },
        ],
      });

      await this.logAiAudit({
        feature: AiFeature.CODE_REVIEW,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: true,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        estimatedCostUsd: this.estimateCostUsd(
          response.usage.input_tokens,
          response.usage.output_tokens,
        ),
        durationMs: Date.now() - startedAt,
        metadata: { language },
      });

      return this.extractText(response);
    } catch (error) {
      await this.logAiAudit({
        feature: AiFeature.CODE_REVIEW,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: { language },
      });
      throw error;
    }
  }

  async estimateProject(
    userId: string,
    role: UserRole,
    requirements: string,
    locale: Language = Language.VI,
  ) {
    const langNote =
      locale === Language.EN
        ? '\n\nRespond in English.'
        : '\n\nTrả lời bằng tiếng Việt.';

    const startedAt = Date.now();

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: ESTIMATE_PROMPT + PROFESSIONAL_OUTPUT_RULES + this.roleDirective(role) + langNote,
        messages: [{ role: 'user', content: this.maskSensitiveData(requirements) }],
      });

      await this.logAiAudit({
        feature: AiFeature.ESTIMATE,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: true,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        estimatedCostUsd: this.estimateCostUsd(
          response.usage.input_tokens,
          response.usage.output_tokens,
        ),
        durationMs: Date.now() - startedAt,
        metadata: { locale },
      });

      const content = this.extractText(response);
      return this.tryParseJson(content);
    } catch (error) {
      await this.logAiAudit({
        feature: AiFeature.ESTIMATE,
        userId,
        model: 'claude-sonnet-4-20250514',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: { locale },
      });
      throw error;
    }
  }

  async generateProgressReport(
    userId: string,
    role: UserRole,
    projectId: string,
    locale: Language = Language.VI,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
        milestones: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    const taskSummary = {
      total: project.tasks.length,
      done: project.tasks.filter((t) => t.status === 'DONE').length,
      inProgress: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      blocked: project.tasks.filter((t) => t.status === 'BLOCKED').length,
    };

    const langNote =
      locale === Language.EN
        ? '\n\nWrite the report in English.'
        : '\n\nViết báo cáo bằng tiếng Việt.';

    const startedAt = Date.now();

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system:
          PROGRESS_REPORT_PROMPT +
          PROFESSIONAL_OUTPUT_RULES +
          this.roleDirective(role) +
          langNote,
        messages: [
          {
            role: 'user',
            content: `Project: ${project.name}\nStatus: ${project.status}\nTask Summary: ${JSON.stringify(taskSummary)}\nMilestones: ${JSON.stringify(project.milestones)}`,
          },
        ],
      });

      await this.logAiAudit({
        feature: AiFeature.PROGRESS_REPORT,
        userId,
        projectId,
        model: 'claude-sonnet-4-20250514',
        success: true,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        estimatedCostUsd: this.estimateCostUsd(
          response.usage.input_tokens,
          response.usage.output_tokens,
        ),
        durationMs: Date.now() - startedAt,
        metadata: { locale },
      });

      return this.extractText(response);
    } catch (error) {
      await this.logAiAudit({
        feature: AiFeature.PROGRESS_REPORT,
        userId,
        projectId,
        model: 'claude-sonnet-4-20250514',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: { locale },
      });
      throw error;
    }
  }

  async generateStrategicPlan(
    userId: string,
    role: UserRole,
    dto: StrategicPlanDto,
  ) {
    const locale = dto.locale ?? Language.VI;

    const project = dto.projectId
      ? await this.prisma.project.findUnique({
          where: { id: dto.projectId },
          include: {
            owner: { select: { id: true, name: true, role: true } },
            client: { select: { id: true, name: true, role: true } },
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                dueDate: true,
                assigneeId: true,
              },
            },
            milestones: {
              select: { id: true, title: true, dueDate: true, isCompleted: true },
            },
            invoices: {
              select: {
                id: true,
                status: true,
                currency: true,
                total: true,
                dueDate: true,
                paidAt: true,
              },
            },
          },
        })
      : null;

    if (dto.projectId && !project) {
      throw new NotFoundException('Project not found');
    }

    if (project && role === UserRole.CLIENT && project.clientId !== userId) {
      throw new ForbiddenException();
    }

    if (project && role === UserRole.MEMBER) {
      const hasAssignedTask = project.tasks.some((task) => task.assigneeId === userId);
      if (!hasAssignedTask) throw new ForbiddenException();
    }

    const taskSummary = project
      ? {
          total: project.tasks.length,
          todo: project.tasks.filter((t) => t.status === 'TODO').length,
          inProgress: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
          inReview: project.tasks.filter((t) => t.status === 'IN_REVIEW').length,
          done: project.tasks.filter((t) => t.status === 'DONE').length,
          blocked: project.tasks.filter((t) => t.status === 'BLOCKED').length,
        }
      : null;

    const commercialSummary = project
      ? {
          totalInvoices: project.invoices.length,
          overdueInvoices: project.invoices.filter(
            (invoice) =>
              invoice.status === 'OVERDUE' ||
              (invoice.status !== 'PAID' && invoice.dueDate < new Date()),
          ).length,
          paidInvoices: project.invoices.filter((invoice) => invoice.status === 'PAID')
            .length,
        }
      : null;

    const languageNote =
      locale === Language.EN
        ? 'Respond in English. Keep business terms concise and executive-ready.'
        : 'Trả lời bằng tiếng Việt. Diễn đạt theo văn phong tư vấn chuyên nghiệp.';

    const startedAt = Date.now();

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system:
          STRATEGIC_PLAN_PROMPT + PROFESSIONAL_OUTPUT_RULES + this.roleDirective(role),
        messages: [
          {
            role: 'user',
            content: [
              `Objective: ${this.maskSensitiveData(dto.objective)}`,
              `Constraints: ${this.maskSensitiveData(dto.constraints || 'None')}`,
              `Include risk matrix: ${dto.includeRiskMatrix !== false}`,
              `User role: ${role}`,
              languageNote,
              `Project Context JSON: ${JSON.stringify(
                project
                  ? {
                      id: project.id,
                      name: project.name,
                      status: project.status,
                      description: project.description,
                      techStack: project.techStack,
                      budget: project.budget,
                      budgetUsd: project.budgetUsd,
                      currency: project.currency,
                      deadline: project.deadline,
                      taskSummary,
                      milestoneSummary: {
                        total: project.milestones.length,
                        completed: project.milestones.filter((m) => m.isCompleted).length,
                      },
                      commercialSummary,
                    }
                  : null,
              )}`,
            ].join('\n\n'),
          },
        ],
      });

      const content = this.extractText(response);
      const parsed = this.tryParseJson(content);

      if (!dto.includeRiskMatrix && 'riskMatrix' in (parsed as Record<string, unknown>)) {
        delete (parsed as Record<string, unknown>).riskMatrix;
      }

      await this.logAiAudit({
        feature: AiFeature.STRATEGIC_PLAN,
        userId,
        projectId: project?.id,
        model: 'claude-sonnet-4-20250514',
        success: true,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        estimatedCostUsd: this.estimateCostUsd(
          response.usage.input_tokens,
          response.usage.output_tokens,
        ),
        durationMs: Date.now() - startedAt,
        metadata: {
          locale,
          includeRiskMatrix: dto.includeRiskMatrix !== false,
        },
      });

      return {
        data: parsed,
        usage: response.usage,
        meta: {
          projectId: project?.id,
          locale,
        },
      };
    } catch (error) {
      await this.logAiAudit({
        feature: AiFeature.STRATEGIC_PLAN,
        userId,
        projectId: project?.id,
        model: 'claude-sonnet-4-20250514',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: {
          locale,
          includeRiskMatrix: dto.includeRiskMatrix !== false,
        },
      });
      throw error;
    }
  }

  async createApplyStrategicPlanRequest(
    userId: string,
    role: UserRole,
    dto: ApplyStrategicPlanDto,
  ) {
    if (role !== UserRole.OWNER && role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        clientId: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    const plan = (dto.plan || {}) as Record<string, unknown>;
    const priorityActions = Array.isArray(plan.priorityActions)
      ? (plan.priorityActions as Record<string, unknown>[])
      : [];

    const deliveryPlan =
      plan.deliveryPlan && typeof plan.deliveryPlan === 'object'
        ? (plan.deliveryPlan as Record<string, unknown>)
        : {};

    const next7Days = Array.isArray(deliveryPlan.next7Days)
      ? (deliveryPlan.next7Days as string[])
      : [];
    const next30Days = Array.isArray(deliveryPlan.next30Days)
      ? (deliveryPlan.next30Days as string[])
      : [];

    if (priorityActions.length === 0 && next7Days.length === 0 && next30Days.length === 0) {
      throw new BadRequestException('Plan does not contain actionable items');
    }

    const request = await this.prisma.aiApplyRequest.create({
      data: {
        projectId: dto.projectId,
        requesterId: userId,
        plan: dto.plan as Prisma.InputJsonValue,
        objective: dto.objective,
        constraints: dto.constraints,
      },
      include: {
        project: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, role: true } },
      },
    });

    const owners = await this.prisma.user.findMany({
      where: {
        role: UserRole.OWNER,
        isActive: true,
      },
      select: { id: true },
    });

    for (const owner of owners) {
      await this.notificationService.create({
        type: NotificationType.SYSTEM,
        title: 'AI Apply Request Pending Review',
        message: `Project "${request.project?.name || dto.projectId}" has a new AI apply request from ${request.requester?.name || 'a user'}.`,
        userId: owner.id,
        data: {
          requestId: request.id,
          projectId: dto.projectId,
          type: 'AI_APPLY_REQUEST_CREATED',
        },
      });
    }

    await this.logAiAudit({
      feature: AiFeature.APPLY_STRATEGIC_PLAN,
      userId,
      projectId: dto.projectId,
      success: true,
      metadata: {
        requestId: request.id,
        mode: 'REQUEST_CREATED',
      },
    });

    return request;
  }

  async listApplyRequests(userId: string, role: UserRole, status?: string) {
    if (role !== UserRole.OWNER && role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }

    const where = {
      ...(status ? { status: status as any } : {}),
    };

    return this.prisma.aiApplyRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, role: true } },
        reviewer: { select: { id: true, name: true, role: true } },
      },
      take: 100,
    });
  }

  async reviewApplyRequest(
    requestId: string,
    userId: string,
    role: UserRole,
    approve: boolean,
    notes?: string,
  ) {
    if (role !== UserRole.OWNER) {
      throw new ForbiddenException('Only OWNER can approve/reject apply requests');
    }

    const request = await this.prisma.aiApplyRequest.findUnique({
      where: { id: requestId },
      include: {
        project: {
          select: { id: true, name: true, ownerId: true, clientId: true },
        },
      },
    });

    if (!request) throw new NotFoundException('Apply request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Apply request already reviewed');
    }

    if (!approve) {
      const rejected = await this.prisma.aiApplyRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewerId: userId,
          reviewedAt: new Date(),
          notes,
        },
      });

      await this.notificationService.create({
        type: NotificationType.SYSTEM,
        title: 'AI Apply Request Rejected',
        message: `Your AI apply request for project "${request.project?.name || request.projectId}" was rejected by OWNER.`,
        userId: request.requesterId,
        data: {
          requestId: request.id,
          projectId: request.projectId,
          type: 'AI_APPLY_REQUEST_REJECTED',
        },
      });

      return rejected;
    }

    const summary = await this.executeStrategicPlanApply(
      request.requesterId,
      {
        projectId: request.projectId,
        plan: request.plan as Record<string, unknown>,
        objective: request.objective || undefined,
        constraints: request.constraints || undefined,
      },
    );

    const approved = await this.prisma.aiApplyRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewerId: userId,
        reviewedAt: new Date(),
        appliedAt: new Date(),
        notes,
      },
    });

    await this.notificationService.create({
      type: NotificationType.SYSTEM,
      title: 'AI Apply Request Approved',
      message: `Your AI apply request for project "${request.project?.name || request.projectId}" has been approved and applied.`,
      userId: request.requesterId,
      data: {
        requestId: request.id,
        projectId: request.projectId,
        type: 'AI_APPLY_REQUEST_APPROVED',
      },
    });

    return { request: approved, summary };
  }

  private async executeStrategicPlanApply(
    creatorId: string,
    dto: ApplyStrategicPlanDto,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        clientId: true,
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    const plan = (dto.plan || {}) as Record<string, unknown>;
    const priorityActions = Array.isArray(plan.priorityActions)
      ? (plan.priorityActions as Record<string, unknown>[])
      : [];

    const deliveryPlan =
      plan.deliveryPlan && typeof plan.deliveryPlan === 'object'
        ? (plan.deliveryPlan as Record<string, unknown>)
        : {};

    const next7Days = Array.isArray(deliveryPlan.next7Days)
      ? (deliveryPlan.next7Days as string[])
      : [];
    const next30Days = Array.isArray(deliveryPlan.next30Days)
      ? (deliveryPlan.next30Days as string[])
      : [];

    const existingMilestones = await this.prisma.milestone.findMany({
      where: { projectId: dto.projectId },
      select: { title: true },
    });

    const existingMilestoneTitles = new Set(
      existingMilestones.map((item) => item.title.trim().toLowerCase()),
    );

    const existingAiTasks = await this.prisma.task.findMany({
      where: { projectId: dto.projectId, labels: { has: 'ai-strategy' } },
      select: { title: true },
    });

    const existingAiTaskTitles = new Set(
      existingAiTasks.map((item) => item.title.trim().toLowerCase()),
    );

    const members = await this.prisma.user.findMany({
      where: {
        role: { in: [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER] },
        isActive: true,
      },
      select: { id: true, role: true },
    });

    const memberByRole = new Map<UserRole, string[]>();
    for (const member of members) {
      const list = memberByRole.get(member.role) || [];
      list.push(member.id);
      memberByRole.set(member.role, list);
    }

    const createdMilestones: string[] = [];
    const skippedMilestones: string[] = [];
    const createdTasks: string[] = [];
    const skippedTasks: string[] = [];

    const createMilestoneIfNeeded = async (title: string, dueDate?: Date) => {
      const key = title.trim().toLowerCase();
      if (!title.trim()) return;
      if (existingMilestoneTitles.has(key)) {
        skippedMilestones.push(title);
        return;
      }

      await this.prisma.milestone.create({
        data: {
          projectId: dto.projectId,
          title,
          description: 'Auto-generated from AI strategic plan.',
          dueDate,
        },
      });

      existingMilestoneTitles.add(key);
      createdMilestones.push(title);
    };

    await createMilestoneIfNeeded('AI Plan - Next 7 Days', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    await createMilestoneIfNeeded('AI Plan - Next 30 Days', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    const createTaskIfNeeded = async (task: {
      title: string;
      description: string;
      impact?: string;
      owner?: string;
      dueDate?: Date;
    }) => {
      const key = task.title.trim().toLowerCase();
      if (!task.title.trim()) return;
      if (existingAiTaskTitles.has(key)) {
        skippedTasks.push(task.title);
        return;
      }

      let assigneeId: string | undefined;
      const owner = (task.owner || '').toUpperCase();
      if (owner === UserRole.OWNER) {
        assigneeId = project.ownerId;
      } else if (owner === UserRole.ADMIN || owner === UserRole.MEMBER) {
        const candidate = (memberByRole.get(owner as UserRole) || [])[0];
        assigneeId = candidate || project.ownerId;
      } else if (owner === UserRole.CLIENT) {
        assigneeId = project.clientId || undefined;
      }

      await this.prisma.task.create({
        data: {
          projectId: dto.projectId,
          creatorId,
          assigneeId,
          title: task.title,
          description: task.description,
          priority: this.toTaskPriority(task.impact),
          dueDate: task.dueDate,
          labels: ['ai-strategy', 'auto-generated'],
        },
      });

      existingAiTaskTitles.add(key);
      createdTasks.push(task.title);
    };

    for (const action of priorityActions) {
      const title = String(action.title || '').trim();
      if (!title) continue;

      await createTaskIfNeeded({
        title,
        description: [
          dto.objective ? `Objective: ${dto.objective}` : '',
          dto.constraints ? `Constraints: ${dto.constraints}` : '',
          action.details ? `Details: ${String(action.details)}` : '',
          action.timeline ? `Timeline: ${String(action.timeline)}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
        impact: String(action.impact || ''),
        owner: String(action.owner || ''),
      });
    }

    for (const item of next7Days) {
      const title = String(item || '').trim();
      if (!title) continue;
      await createTaskIfNeeded({
        title: `7D: ${title}`,
        description: 'Auto-generated from Strategic Plan > next7Days',
        impact: 'HIGH',
        owner: 'MEMBER',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }

    for (const item of next30Days) {
      const title = String(item || '').trim();
      if (!title) continue;
      await createTaskIfNeeded({
        title: `30D: ${title}`,
        description: 'Auto-generated from Strategic Plan > next30Days',
        impact: 'MEDIUM',
        owner: 'MEMBER',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    return {
      projectId: dto.projectId,
      summary: {
        createdMilestones,
        skippedMilestones,
        createdTasks,
        skippedTasks,
      },
    };
  }

  async applyStrategicPlan(
    userId: string,
    role: UserRole,
    dto: ApplyStrategicPlanDto,
  ) {
    const request = await this.createApplyStrategicPlanRequest(userId, role, dto);
    return {
      requestId: request.id,
      status: request.status,
      message: 'Apply request submitted and awaiting OWNER approval.',
    };
  }

  async getAiAuditLogs(userId: string, role: UserRole, limit = 50, days = 30) {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    const safeDays = Math.max(1, Math.min(days, 3650));

    const createdAtFrom = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    return this.prisma.aiUsageAudit.findMany({
      where:
        role === UserRole.OWNER || role === UserRole.ADMIN
          ? { createdAt: { gte: createdAtFrom } }
          : { userId, createdAt: { gte: createdAtFrom } },
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
      include: {
        user: { select: { id: true, name: true, role: true } },
        project: { select: { id: true, name: true } },
      },
    });
  }

  async getAiAuditSummary(userId: string, role: UserRole, days = 30) {
    const safeDays = Math.max(1, Math.min(days, 3650));
    const createdAtFrom = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

    const baseWhere =
      role === UserRole.OWNER || role === UserRole.ADMIN
        ? { createdAt: { gte: createdAtFrom } }
        : { userId, createdAt: { gte: createdAtFrom } };

    const logs = await this.prisma.aiUsageAudit.findMany({
      where: baseWhere,
      select: {
        id: true,
        feature: true,
        success: true,
        totalTokens: true,
        estimatedCostUsd: true,
        durationMs: true,
        projectId: true,
      },
    });

    const totalRequests = logs.length;
    const successfulRequests = logs.filter((l) => l.success).length;
    const totalTokens = logs.reduce((sum, l) => sum + (l.totalTokens || 0), 0);
    const totalCostUsd = logs.reduce(
      (sum, l) => sum + Number(l.estimatedCostUsd || 0),
      0,
    );
    const avgDurationMs =
      totalRequests > 0
        ? Math.round(
            logs.reduce((sum, l) => sum + (l.durationMs || 0), 0) / totalRequests,
          )
        : 0;

    const byFeatureMap = new Map<string, { requests: number; success: number; costUsd: number }>();
    for (const log of logs) {
      const entry = byFeatureMap.get(log.feature) || {
        requests: 0,
        success: 0,
        costUsd: 0,
      };
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

  async updateAiAuditFeedback(
    auditId: string,
    userId: string,
    role: UserRole,
    dto: AiAuditFeedbackDto,
  ) {
    const audit = await this.prisma.aiUsageAudit.findUnique({
      where: { id: auditId },
      select: { id: true, userId: true },
    });

    if (!audit) throw new NotFoundException('AI audit record not found');

    if (
      role !== UserRole.OWNER &&
      role !== UserRole.ADMIN &&
      audit.userId !== userId
    ) {
      throw new ForbiddenException();
    }

    return this.prisma.aiUsageAudit.update({
      where: { id: auditId },
      data: {
        effectivenessScore: dto.effectivenessScore,
        feedbackNote: dto.feedbackNote,
      },
    });
  }

  async deleteAiAuditLog(auditId: string, userId: string, role: UserRole) {
    const audit = await this.prisma.aiUsageAudit.findUnique({
      where: { id: auditId },
      select: { id: true, userId: true },
    });

    if (!audit) throw new NotFoundException('AI audit record not found');

    if (role !== UserRole.OWNER && role !== UserRole.ADMIN && audit.userId !== userId) {
      throw new ForbiddenException();
    }

    return this.prisma.aiUsageAudit.delete({ where: { id: auditId } });
  }

  async purgeAiAuditLogs(role: UserRole, retentionDays = 90) {
    if (role !== UserRole.OWNER && role !== UserRole.ADMIN) {
      throw new ForbiddenException();
    }

    return this.purgeAiAuditLogsInternal(retentionDays);
  }

  private async purgeAiAuditLogsInternal(retentionDays = 90) {

    const safeRetention = Math.max(1, Math.min(retentionDays, 3650));
    const cutoff = new Date(Date.now() - safeRetention * 24 * 60 * 60 * 1000);

    const result = await this.prisma.aiUsageAudit.deleteMany({
      where: {
        createdAt: { lt: cutoff },
      },
    });

    return {
      retentionDays: safeRetention,
      deletedCount: result.count,
    };
  }

  private async buildPublicBrandContext(): Promise<PublicBrandContext> {
    const [siteContents, showcaseProjects] = await this.prisma.$transaction([
      this.prisma.siteContent.findMany({
        where: {
          isActive: true,
          section: {
            in: ['about', 'services', 'portfolio', 'founder-profile', 'founder_cv'],
          },
        },
        select: {
          section: true,
          data: true,
        },
      }),
      this.prisma.project.findMany({
        where: { isShowcase: true },
        select: {
          name: true,
          showcaseCategory: true,
          techStack: true,
          showcaseResults: true,
        },
        orderBy: [{ showcaseOrder: 'asc' }, { updatedAt: 'desc' }],
        take: 8,
      }),
    ]);

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

  private toPublicBrandContextText(context: PublicBrandContext) {
    return [
      'VERIFIED BRAND CONTEXT (REAL DATA):',
      `- About: ${context.aboutSummary || 'Not available'}`,
      `- Founder profile (Nguyen Hoang Thai): ${context.founderProfile || 'Not available in DB. Do not fabricate.'}`,
      `- Services: ${context.services.length ? context.services.join(', ') : 'Not available'}`,
      `- Portfolio projects: ${
        context.showcaseProjects.length
          ? context.showcaseProjects
              .map(
                (p) =>
                  `${p.name} [${p.category}] | Tech: ${p.techStack.join(', ') || 'N/A'} | Results: ${p.results || 'N/A'}`,
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

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleAuditRetentionCron() {
    const retentionFromEnv = Number(this.configService.get('AI_AUDIT_RETENTION_DAYS') || 90);
    const result = await this.purgeAiAuditLogsInternal(retentionFromEnv);
    this.logger.log(
      `AI audit retention cron executed. Deleted ${result.deletedCount} records older than ${result.retentionDays} day(s).`,
    );
  }

  // ==================== PUBLIC CHAT ====================

  async chatPublic(message: string) {
    const startedAt = Date.now();
    const sanitizedMessage = this.maskSensitiveData(message);

    try {
      const brandContext = await this.buildPublicBrandContext();
      const publicContext = this.toPublicBrandContextText(brandContext);

      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: PUBLIC_FAQ_PROMPT + PROFESSIONAL_OUTPUT_RULES + `\n\n${publicContext}`,
        messages: [{ role: 'user', content: sanitizedMessage }],
      });

      await this.logAiAudit({
        feature: AiFeature.PUBLIC_CHAT,
        model: 'claude-sonnet-4-20250514',
        success: true,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        estimatedCostUsd: this.estimateCostUsd(
          response.usage.input_tokens,
          response.usage.output_tokens,
        ),
        durationMs: Date.now() - startedAt,
      });

      const assistantMessage = this.extractText(response);

      return { message: assistantMessage };
    } catch (error) {
      await this.logAiAudit({
        feature: AiFeature.PUBLIC_CHAT,
        model: 'claude-sonnet-4-20250514',
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
      });
      throw error;
    }
  }
}
