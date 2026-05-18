import {
  AiApplyRequest,
  AiUsageAudit,
  AiFeature,
  Currency,
  ProjectStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import {
  AiApplyRequestWithProject,
  AiApplyRequestWithRelations,
  AiApplyRequestWithRequester,
  AiAuditLogWithRelations,
  AiConversationWithMessages,
  AiProgressProject,
  AiStrategicProject,
} from './ai.types';

export interface AiUsageAuditSummaryRow {
  id: string;
  feature: AiFeature;
  success: boolean;
  totalTokens: number | null;
  estimatedCostUsd: Prisma.Decimal | null;
  durationMs: number | null;
  projectId: string | null;
}

export interface AiProjectContextItem {
  name: string;
  status: ProjectStatus;
  description: string | null;
  techStack: string[];
  budget: number | null;
  currency: Currency | null;
  _count: { tasks: number };
}

export interface OperationalSnapshot {
  scope: 'CLIENT_ONLY' | 'INTERNAL';
  generatedAt: string;
  teamMembers: number | null;
  activeClients: number | null;
  projectsInProgress: number;
  tasksInProgress: number;
}

export interface PublicBrandContextData {
  siteContents: Array<{ section: string; data: Prisma.InputJsonValue | null }>;
  showcaseProjects: Array<{
    name: string;
    showcaseCategory: string | null;
    techStack: string[];
    showcaseResults: string | null;
  }>;
}

// Pattern: Repository Port
export interface AiRepositoryPort {
  createUsageAudit(data: Prisma.AiUsageAuditCreateInput): Promise<AiUsageAudit>;
  countUsageAudit(where: Prisma.AiUsageAuditWhereInput): Promise<number>;
  findUsageAuditById(id: string): Promise<{ id: string; userId: string } | null>;
  findUsageAuditLogs(
    where: Prisma.AiUsageAuditWhereInput,
    take: number,
  ): Promise<AiAuditLogWithRelations[]>;
  findUsageAuditSummary(where: Prisma.AiUsageAuditWhereInput): Promise<AiUsageAuditSummaryRow[]>;
  updateUsageAudit(
    id: string,
    data: Prisma.AiUsageAuditUpdateInput,
  ): Promise<AiUsageAudit>;
  deleteUsageAudit(id: string): Promise<AiUsageAudit>;
  deleteUsageAuditBefore(cutoff: Date): Promise<number>;

  findPromptSection(): Promise<{ isActive: boolean; data: Prisma.InputJsonValue | null } | null>;

  findUserQuota(userId: string): Promise<{
    id: string;
    aiQuotaUsedTokens: number;
    aiQuotaLimitTokens: number;
  } | null>;
  incrementUserQuota(userId: string, totalTokens: number): Promise<void>;

  findConversationWithMessages(
    conversationId: string,
    userId: string,
  ): Promise<AiConversationWithMessages | null>;
  createConversation(userId: string, title: string): Promise<AiConversationWithMessages>;
  createMessage(data: {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    tokenUsage?: number;
  }): Promise<void>;

  findProjectsForChatContext(
    userId: string,
    role?: UserRole,
  ): Promise<AiProjectContextItem[]>;
  getOperationalSnapshot(userId: string, role?: UserRole): Promise<OperationalSnapshot>;

  findProjectForProgressReport(projectId: string): Promise<AiProgressProject | null>;
  findProjectForStrategicPlan(projectId: string): Promise<AiStrategicProject | null>;
  findProjectSummary(projectId: string): Promise<{
    id: string;
    name: string;
    ownerId: string;
    clientId: string | null;
  } | null>;

  createApplyRequest(data: Prisma.AiApplyRequestCreateInput): Promise<AiApplyRequestWithRequester>;
  listApplyRequests(status?: string): Promise<AiApplyRequestWithRelations[]>;
  findApplyRequestById(requestId: string): Promise<AiApplyRequestWithProject | null>;
  updateApplyRequest(
    requestId: string,
    data: Prisma.AiApplyRequestUpdateInput,
  ): Promise<AiApplyRequest>;
  findOwnerIds(): Promise<string[]>;

  findMilestoneTitles(projectId: string): Promise<string[]>;
  findAiTaskTitles(projectId: string): Promise<string[]>;
  findActiveMembers(): Promise<Array<{ id: string; role: UserRole }>>;
  createMilestone(data: Prisma.MilestoneCreateInput): Promise<void>;
  createTask(data: Prisma.TaskCreateInput): Promise<void>;

  findPublicBrandContextData(): Promise<PublicBrandContextData>;
}
