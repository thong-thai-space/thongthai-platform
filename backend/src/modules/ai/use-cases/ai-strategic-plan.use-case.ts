import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AiFeature,
  Language,
  NotificationType,
  Prisma,
  UserRole,
} from '@prisma/client';
import { ApplyStrategicPlanDto, StrategicPlanDto } from '../dto/ai.dto';
import { AI_NOTIFICATION_PORT, AI_PROVIDER_PORT, AI_REPOSITORY } from '../ai.constants';
import type { AiNotificationPort } from '../domain/ai.notification.port';
import type { AiProviderPort } from '../domain/ai.provider.port';
import type { AiRepositoryPort } from '../domain/ai.repository.port';
import { AiPolicy } from '../policies/ai.policy';
import { AiAuditService } from '../support/ai-audit.service';
import { AiPromptConfigService } from '../support/ai-prompt-config.service';
import {
  AI_MODEL,
  estimateCostUsd,
  maskSensitiveData,
  roleDirective,
  toTaskPriority,
  tryParseJson,
} from '../support/ai-content.helpers';

// Pattern: Use Case — strategic plan generation + apply-request review workflow
@Injectable()
export class AiStrategicPlanUseCase {
  constructor(
    @Inject(AI_REPOSITORY)
    private readonly repo: AiRepositoryPort,
    @Inject(AI_PROVIDER_PORT)
    private readonly provider: AiProviderPort,
    @Inject(AI_NOTIFICATION_PORT)
    private readonly notifier: AiNotificationPort,
    private readonly prompts: AiPromptConfigService,
    private readonly audit: AiAuditService,
    private readonly aiPolicy: AiPolicy,
  ) {}

  async generatePlan(userId: string, role: UserRole, dto: StrategicPlanDto) {
    const promptConfig = await this.prompts.get();
    const locale = dto.locale ?? Language.VI;

    const project = dto.projectId
      ? await this.repo.findProjectForStrategicPlan(dto.projectId)
      : null;

    if (dto.projectId && !project) throw new NotFoundException('Project not found');
    if (project) this.aiPolicy.assertStrategicPlanAccess(project, role, userId);

    const projectContext = this.serializeProjectContext(project);
    const languageNote =
      locale === Language.EN
        ? 'Respond in English. Keep business terms concise and executive-ready.'
        : 'Tra loi bang tieng Viet. Dien dat theo van phong tu van chuyen nghiep.';

    const startedAt = Date.now();
    try {
      const response = await this.provider.createMessage({
        model: AI_MODEL,
        maxTokens: 4096,
        system:
          promptConfig.strategicPlan +
          promptConfig.professionalOutputRules +
          roleDirective(role),
        messages: [
          {
            role: 'user',
            content: [
              `Objective: ${maskSensitiveData(dto.objective)}`,
              `Constraints: ${maskSensitiveData(dto.constraints || 'None')}`,
              `Include risk matrix: ${dto.includeRiskMatrix !== false}`,
              `User role: ${role}`,
              languageNote,
              `Project Context JSON: ${JSON.stringify(projectContext)}`,
            ].join('\n\n'),
          },
        ],
      });

      const parsed = tryParseJson(response.text);
      if (!dto.includeRiskMatrix && 'riskMatrix' in (parsed as Record<string, unknown>)) {
        delete (parsed as Record<string, unknown>).riskMatrix;
      }

      await this.audit.log({
        feature: AiFeature.STRATEGIC_PLAN,
        userId,
        projectId: project?.id,
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
        metadata: { locale, includeRiskMatrix: dto.includeRiskMatrix !== false },
      });

      return {
        data: parsed,
        usage: {
          input_tokens: response.usage.inputTokens,
          output_tokens: response.usage.outputTokens,
        },
        meta: { projectId: project?.id, locale },
      };
    } catch (error) {
      await this.audit.log({
        feature: AiFeature.STRATEGIC_PLAN,
        userId,
        projectId: project?.id,
        model: AI_MODEL,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown AI error',
        durationMs: Date.now() - startedAt,
        metadata: { locale, includeRiskMatrix: dto.includeRiskMatrix !== false },
      });
      throw error;
    }
  }

  async createApplyRequest(userId: string, role: UserRole, dto: ApplyStrategicPlanDto) {
    this.aiPolicy.assertOwnerOrAdmin(role);

    const project = await this.repo.findProjectSummary(dto.projectId);
    if (!project) throw new NotFoundException('Project not found');

    const { priorityActions, next7Days, next30Days } = this.extractPlanItems(dto.plan);
    if (priorityActions.length === 0 && next7Days.length === 0 && next30Days.length === 0) {
      throw new BadRequestException('Plan does not contain actionable items');
    }

    const request = await this.repo.createApplyRequest({
      project: { connect: { id: dto.projectId } },
      requester: { connect: { id: userId } },
      plan: dto.plan as Prisma.InputJsonValue,
      objective: dto.objective,
      constraints: dto.constraints,
    });

    const owners = await this.repo.findOwnerIds();
    await Promise.all(
      owners.map((ownerId) =>
        this.notifier.create({
          type: NotificationType.SYSTEM,
          title: 'AI Apply Request Pending Review',
          message: `Project "${request.project?.name || dto.projectId}" has a new AI apply request from ${
            request.requester?.name || 'a user'
          }.`,
          userId: ownerId,
          data: {
            requestId: request.id,
            projectId: dto.projectId,
            type: 'AI_APPLY_REQUEST_CREATED',
          },
        }),
      ),
    );

    await this.audit.log({
      feature: AiFeature.APPLY_STRATEGIC_PLAN,
      userId,
      projectId: dto.projectId,
      success: true,
      metadata: { requestId: request.id, mode: 'REQUEST_CREATED' },
    });

    return request;
  }

  async apply(userId: string, role: UserRole, dto: ApplyStrategicPlanDto) {
    const request = await this.createApplyRequest(userId, role, dto);
    return {
      requestId: request.id,
      status: request.status,
      message: 'Apply request submitted and awaiting OWNER approval.',
    };
  }

  listApplyRequests(_userId: string, role: UserRole, status?: string) {
    this.aiPolicy.assertOwnerOrAdmin(role);
    return this.repo.listApplyRequests(status);
  }

  async reviewApplyRequest(
    requestId: string,
    userId: string,
    role: UserRole,
    approve: boolean,
    notes?: string,
  ) {
    this.aiPolicy.assertOwnerOnly(role, 'Only OWNER can approve/reject apply requests');

    const request = await this.repo.findApplyRequestById(requestId);
    if (!request) throw new NotFoundException('Apply request not found');

    this.aiPolicy.assertApplyRequestPending(request);

    if (!approve) {
      const rejected = await this.repo.updateApplyRequest(requestId, {
        status: 'REJECTED',
        reviewer: { connect: { id: userId } },
        reviewedAt: new Date(),
        notes,
      });

      await this.notifier.create({
        type: NotificationType.SYSTEM,
        title: 'AI Apply Request Rejected',
        message: `Your AI apply request for project "${
          request.project?.name || request.projectId
        }" was rejected by OWNER.`,
        userId: request.requesterId,
        data: {
          requestId: request.id,
          projectId: request.projectId,
          type: 'AI_APPLY_REQUEST_REJECTED',
        },
      });
      return rejected;
    }

    const summary = await this.executeApply(request.requesterId, {
      projectId: request.projectId,
      plan: request.plan as Record<string, unknown>,
      objective: request.objective || undefined,
      constraints: request.constraints || undefined,
    });

    const approved = await this.repo.updateApplyRequest(requestId, {
      status: 'APPROVED',
      reviewer: { connect: { id: userId } },
      reviewedAt: new Date(),
      appliedAt: new Date(),
      notes,
    });

    await this.notifier.create({
      type: NotificationType.SYSTEM,
      title: 'AI Apply Request Approved',
      message: `Your AI apply request for project "${
        request.project?.name || request.projectId
      }" has been approved and applied.`,
      userId: request.requesterId,
      data: {
        requestId: request.id,
        projectId: request.projectId,
        type: 'AI_APPLY_REQUEST_APPROVED',
      },
    });

    return { request: approved, summary };
  }

  // ── Private helpers ──────────────────────────────────────────────────

  private serializeProjectContext(
    project: Awaited<ReturnType<AiRepositoryPort['findProjectForStrategicPlan']>>,
  ) {
    if (!project) return null;
    const taskSummary = {
      total: project.tasks.length,
      todo: project.tasks.filter((t) => t.status === 'TODO').length,
      inProgress: project.tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      inReview: project.tasks.filter((t) => t.status === 'IN_REVIEW').length,
      done: project.tasks.filter((t) => t.status === 'DONE').length,
      blocked: project.tasks.filter((t) => t.status === 'BLOCKED').length,
    };
    const commercialSummary = {
      totalInvoices: project.invoices.length,
      overdueInvoices: project.invoices.filter(
        (invoice) =>
          invoice.status === 'OVERDUE' ||
          (invoice.status !== 'PAID' && invoice.dueDate < new Date()),
      ).length,
      paidInvoices: project.invoices.filter((invoice) => invoice.status === 'PAID').length,
    };
    return {
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
    };
  }

  private extractPlanItems(rawPlan: Record<string, unknown> | undefined) {
    const plan = (rawPlan || {}) as Record<string, unknown>;
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
    return { priorityActions, next7Days, next30Days };
  }

  /**
   * Pattern: Saga — applies the plan to milestones + tasks one at a time.
   *
   * Why no `$transaction`: a strategic plan can produce dozens of writes; wrapping
   * them in a transaction risks Postgres lock timeouts. Instead we dedup against
   * the DB via title-set lookups so a partial failure can be safely retried.
   */
  private async executeApply(creatorId: string, dto: ApplyStrategicPlanDto) {
    const project = await this.repo.findProjectSummary(dto.projectId);
    if (!project) throw new NotFoundException('Project not found');

    const { priorityActions, next7Days, next30Days } = this.extractPlanItems(dto.plan);

    const existingMilestones = new Set(
      (await this.repo.findMilestoneTitles(dto.projectId)).map((t) => t.trim().toLowerCase()),
    );
    const existingAiTasks = new Set(
      (await this.repo.findAiTaskTitles(dto.projectId)).map((t) => t.trim().toLowerCase()),
    );

    const members = await this.repo.findActiveMembers();
    const memberByRole = new Map<UserRole, string[]>();
    for (const member of members) {
      const list = memberByRole.get(member.role) ?? [];
      list.push(member.id);
      memberByRole.set(member.role, list);
    }

    const createdMilestones: string[] = [];
    const skippedMilestones: string[] = [];
    const createdTasks: string[] = [];
    const skippedTasks: string[] = [];

    const createMilestoneIfNeeded = async (title: string, dueDate?: Date) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (existingMilestones.has(key)) {
        skippedMilestones.push(trimmed);
        return;
      }
      await this.repo.createMilestone({
        project: { connect: { id: dto.projectId } },
        title: trimmed,
        description: 'Auto-generated from AI strategic plan.',
        dueDate,
      });
      existingMilestones.add(key);
      createdMilestones.push(trimmed);
    };

    await createMilestoneIfNeeded(
      'AI Plan - Next 7 Days',
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );
    await createMilestoneIfNeeded(
      'AI Plan - Next 30 Days',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    );

    const createTaskIfNeeded = async (task: {
      title: string;
      description: string;
      impact?: string;
      owner?: string;
      dueDate?: Date;
    }) => {
      const trimmed = task.title.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (existingAiTasks.has(key)) {
        skippedTasks.push(trimmed);
        return;
      }
      const assigneeId = this.resolveAssignee(task.owner, project, memberByRole);
      await this.repo.createTask({
        project: { connect: { id: dto.projectId } },
        creator: { connect: { id: creatorId } },
        ...(assigneeId ? { assignee: { connect: { id: assigneeId } } } : {}),
        title: trimmed,
        description: task.description,
        priority: toTaskPriority(task.impact),
        dueDate: task.dueDate,
        labels: ['ai-strategy', 'auto-generated'],
      });
      existingAiTasks.add(key);
      createdTasks.push(trimmed);
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
      summary: { createdMilestones, skippedMilestones, createdTasks, skippedTasks },
    };
  }

  private resolveAssignee(
    rawOwner: string | undefined,
    project: { ownerId: string; clientId: string | null },
    memberByRole: Map<UserRole, string[]>,
  ): string | undefined {
    const owner = (rawOwner || '').toUpperCase();
    if (owner === UserRole.OWNER) return project.ownerId;
    if (owner === UserRole.ADMIN || owner === UserRole.MEMBER) {
      return (memberByRole.get(owner as UserRole) || [])[0] || project.ownerId;
    }
    if (owner === UserRole.CLIENT) return project.clientId || undefined;
    return undefined;
  }
}
