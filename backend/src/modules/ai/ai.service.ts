import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import Anthropic from '@anthropic-ai/sdk';
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
} from './prompts';

@Injectable()
export class AiService {
  private client: Anthropic;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private notificationService: NotificationService,
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

  private async buildOperationalSnapshot(userId: string, userRole?: UserRole) {
    // Client role only sees their own operational metrics.
    if (userRole === UserRole.CLIENT) {
      const [clientProjects, clientTaskCounts] = await this.prisma.$transaction([
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
        this.prisma.task.groupBy({
          by: ['status'],
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
          _count: { status: true },
        }),
      ]);

      const tasksInProgress = clientTaskCounts.reduce(
        (sum, row) => sum + row._count.status,
        0,
      );

      return {
        scope: 'CLIENT_ONLY',
        generatedAt: new Date().toISOString(),
        teamMembers: null,
        activeClients: null,
        projectsInProgress: clientProjects,
        tasksInProgress,
      };
    }

    const [teamMembers, activeClients, projectsInProgress, taskCounts] =
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
        this.prisma.task.groupBy({
          by: ['status'],
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
          _count: { status: true },
        }),
      ]);

    const tasksInProgress = taskCounts.reduce((sum, row) => sum + row._count.status, 0);

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
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: PUBLIC_FAQ_PROMPT + PROFESSIONAL_OUTPUT_RULES,
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
