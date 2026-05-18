import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserRole, Language } from '@prisma/client';
import {
  AiAuditFeedbackDto,
  ApplyStrategicPlanDto,
  StrategicPlanDto,
} from './dto/ai.dto';
import { AiUseCases } from './use-cases/ai.use-cases';

// Pattern: Facade
@Injectable()
export class AiService {
  constructor(private aiUseCases: AiUseCases) {}

  generateArchitectureDiagram(
    userId: string,
    role: UserRole,
    message: string,
    file?: Express.Multer.File,
  ) {
    return this.aiUseCases.generateArchitectureDiagram(userId, role, message, file);
  }

  chat(userId: string, message: string, conversationId?: string, role?: UserRole) {
    return this.aiUseCases.chat(userId, message, conversationId, role);
  }

  generateProposal(
    userId: string,
    role: UserRole,
    requirements: string,
    locale: Language = Language.VI,
    budget?: string,
  ) {
    return this.aiUseCases.generateProposal(userId, role, requirements, locale, budget);
  }

  breakdownTasks(userId: string, role: UserRole, description: string, techStack: string[]) {
    return this.aiUseCases.breakdownTasks(userId, role, description, techStack);
  }

  reviewCode(
    userId: string,
    role: UserRole,
    code: string,
    language: string,
    context?: string,
  ) {
    return this.aiUseCases.reviewCode(userId, role, code, language, context);
  }

  estimateProject(
    userId: string,
    role: UserRole,
    requirements: string,
    locale: Language = Language.VI,
  ) {
    return this.aiUseCases.estimateProject(userId, role, requirements, locale);
  }

  generateProgressReport(
    userId: string,
    role: UserRole,
    projectId: string,
    locale: Language = Language.VI,
  ) {
    return this.aiUseCases.generateProgressReport(userId, role, projectId, locale);
  }

  generateStrategicPlan(userId: string, role: UserRole, dto: StrategicPlanDto) {
    return this.aiUseCases.generateStrategicPlan(userId, role, dto);
  }

  applyStrategicPlan(userId: string, role: UserRole, dto: ApplyStrategicPlanDto) {
    return this.aiUseCases.applyStrategicPlan(userId, role, dto);
  }

  listApplyRequests(userId: string, role: UserRole, status?: string) {
    return this.aiUseCases.listApplyRequests(userId, role, status);
  }

  reviewApplyRequest(
    requestId: string,
    userId: string,
    role: UserRole,
    approve: boolean,
    notes?: string,
  ) {
    return this.aiUseCases.reviewApplyRequest(requestId, userId, role, approve, notes);
  }

  getAiAuditLogs(userId: string, role: UserRole, limit?: number, days?: number) {
    return this.aiUseCases.getAiAuditLogs(userId, role, limit, days);
  }

  getAiAuditSummary(userId: string, role: UserRole, days?: number) {
    return this.aiUseCases.getAiAuditSummary(userId, role, days);
  }

  updateAiAuditFeedback(
    auditId: string,
    userId: string,
    role: UserRole,
    dto: AiAuditFeedbackDto,
  ) {
    return this.aiUseCases.updateAiAuditFeedback(auditId, userId, role, dto);
  }

  deleteAiAuditLog(auditId: string, userId: string, role: UserRole) {
    return this.aiUseCases.deleteAiAuditLog(auditId, userId, role);
  }

  purgeAiAuditLogs(role: UserRole, retentionDays?: number) {
    return this.aiUseCases.purgeAiAuditLogs(role, retentionDays);
  }

  chatPublic(message: string) {
    return this.aiUseCases.chatPublic(message);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleAuditRetentionCron() {
    await this.aiUseCases.runAuditRetentionCron();
  }
}
