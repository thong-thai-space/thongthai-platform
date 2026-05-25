import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserRole, Language } from '@prisma/client';
import {
  AiAuditFeedbackDto,
  ApplyStrategicPlanDto,
  StrategicPlanDto,
} from './dto/ai.dto';
import { AiArchitectureUseCase } from './use-cases/ai-architecture.use-case';
import { AiAuditUseCase } from './use-cases/ai-audit.use-case';
import { AiChatUseCase } from './use-cases/ai-chat.use-case';
import { AiGenerationUseCase } from './use-cases/ai-generation.use-case';
import { AiPublicChatUseCase } from './use-cases/ai-public-chat.use-case';
import { AiStrategicPlanUseCase } from './use-cases/ai-strategic-plan.use-case';

// Pattern: Facade — delegates to one of six specialized use cases
@Injectable()
export class AiService {
  constructor(
    private readonly architectureUseCase: AiArchitectureUseCase,
    private readonly chatUseCase: AiChatUseCase,
    private readonly generationUseCase: AiGenerationUseCase,
    private readonly strategicPlanUseCase: AiStrategicPlanUseCase,
    private readonly auditUseCase: AiAuditUseCase,
    private readonly publicChatUseCase: AiPublicChatUseCase,
  ) {}

  generateArchitectureDiagram(
    userId: string,
    role: UserRole,
    message: string,
    file?: Express.Multer.File,
  ) {
    return this.architectureUseCase.execute(userId, role, message, file);
  }

  chat(
    userId: string,
    message: string,
    conversationId?: string,
    role?: UserRole,
  ) {
    return this.chatUseCase.execute(userId, message, conversationId, role);
  }

  generateProposal(
    userId: string,
    role: UserRole,
    requirements: string,
    locale: Language = Language.VI,
    budget?: string,
  ) {
    return this.generationUseCase.generateProposal(
      userId,
      role,
      requirements,
      locale,
      budget,
    );
  }

  breakdownTasks(
    userId: string,
    role: UserRole,
    description: string,
    techStack: string[],
  ) {
    return this.generationUseCase.breakdownTasks(
      userId,
      role,
      description,
      techStack,
    );
  }

  reviewCode(
    userId: string,
    role: UserRole,
    code: string,
    language: string,
    context?: string,
  ) {
    return this.generationUseCase.reviewCode(
      userId,
      role,
      code,
      language,
      context,
    );
  }

  estimateProject(
    userId: string,
    role: UserRole,
    requirements: string,
    locale: Language = Language.VI,
  ) {
    return this.generationUseCase.estimateProject(
      userId,
      role,
      requirements,
      locale,
    );
  }

  generateProgressReport(
    userId: string,
    role: UserRole,
    projectId: string,
    locale: Language = Language.VI,
  ) {
    return this.generationUseCase.generateProgressReport(
      userId,
      role,
      projectId,
      locale,
    );
  }

  generateStrategicPlan(userId: string, role: UserRole, dto: StrategicPlanDto) {
    return this.strategicPlanUseCase.generatePlan(userId, role, dto);
  }

  applyStrategicPlan(
    userId: string,
    role: UserRole,
    dto: ApplyStrategicPlanDto,
  ) {
    return this.strategicPlanUseCase.apply(userId, role, dto);
  }

  listApplyRequests(userId: string, role: UserRole, status?: string) {
    return this.strategicPlanUseCase.listApplyRequests(userId, role, status);
  }

  reviewApplyRequest(
    requestId: string,
    userId: string,
    role: UserRole,
    approve: boolean,
    notes?: string,
  ) {
    return this.strategicPlanUseCase.reviewApplyRequest(
      requestId,
      userId,
      role,
      approve,
      notes,
    );
  }

  getAiAuditLogs(
    userId: string,
    role: UserRole,
    limit?: number,
    days?: number,
  ) {
    return this.auditUseCase.getLogs(userId, role, limit, days);
  }

  getAiAuditSummary(userId: string, role: UserRole, days?: number) {
    return this.auditUseCase.getSummary(userId, role, days);
  }

  updateAiAuditFeedback(
    auditId: string,
    userId: string,
    role: UserRole,
    dto: AiAuditFeedbackDto,
  ) {
    return this.auditUseCase.updateFeedback(auditId, userId, role, dto);
  }

  deleteAiAuditLog(auditId: string, userId: string, role: UserRole) {
    return this.auditUseCase.deleteLog(auditId, userId, role);
  }

  purgeAiAuditLogs(role: UserRole, retentionDays?: number) {
    return this.auditUseCase.purge(role, retentionDays);
  }

  chatPublic(message: string) {
    return this.publicChatUseCase.execute(message);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleAuditRetentionCron() {
    await this.auditUseCase.runRetentionCron();
  }
}
