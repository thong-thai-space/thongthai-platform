import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AiApplyRequest, AiUsageAudit, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  aiApplyRequestCreateIncludes,
  aiApplyRequestListIncludes,
  aiApplyRequestReviewIncludes,
  aiAuditLogIncludes,
  aiConversationIncludes,
  aiProgressProjectIncludes,
  aiStrategicProjectIncludes,
} from '../domain/ai.types';
import {
  AiRepositoryPort,
  AiUsageAuditSummaryRow,
  OperationalSnapshot,
  PublicBrandContextData,
} from '../domain/ai.repository.port';

// Pattern: Repository
@Injectable()
export class AiRepository implements AiRepositoryPort {
  constructor(private prisma: PrismaService) {}

  async createUsageAudit(
    data: Prisma.AiUsageAuditCreateInput,
  ): Promise<AiUsageAudit> {
    try {
      return await this.prisma.aiUsageAudit.create({ data });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create AI usage audit');
    }
  }

  async countUsageAudit(where: Prisma.AiUsageAuditWhereInput): Promise<number> {
    try {
      return await this.prisma.aiUsageAudit.count({ where });
    } catch (error) {
      throw new InternalServerErrorException('Failed to count AI usage audit');
    }
  }

  async findUsageAuditById(
    id: string,
  ): Promise<{ id: string; userId: string } | null> {
    try {
      const audit = await this.prisma.aiUsageAudit.findUnique({
        where: { id },
        select: { id: true, userId: true },
      });
      if (!audit || !audit.userId) return null;
      return { id: audit.id, userId: audit.userId };
    } catch {
      throw new InternalServerErrorException('Failed to fetch AI audit record');
    }
  }

  async findUsageAuditLogs(where: Prisma.AiUsageAuditWhereInput, take: number) {
    try {
      return await this.prisma.aiUsageAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        include: aiAuditLogIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch AI audit logs');
    }
  }

  async findUsageAuditSummary(
    where: Prisma.AiUsageAuditWhereInput,
  ): Promise<AiUsageAuditSummaryRow[]> {
    try {
      return await this.prisma.aiUsageAudit.findMany({
        where,
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
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch AI audit summary',
      );
    }
  }

  async updateUsageAudit(
    id: string,
    data: Prisma.AiUsageAuditUpdateInput,
  ): Promise<AiUsageAudit> {
    try {
      return await this.prisma.aiUsageAudit.update({
        where: { id },
        data,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update AI audit record',
      );
    }
  }

  async deleteUsageAudit(id: string): Promise<AiUsageAudit> {
    try {
      return await this.prisma.aiUsageAudit.delete({ where: { id } });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete AI audit record',
      );
    }
  }

  async deleteUsageAuditBefore(cutoff: Date): Promise<number> {
    try {
      const result = await this.prisma.aiUsageAudit.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      return result.count;
    } catch (error) {
      throw new InternalServerErrorException('Failed to purge AI audit logs');
    }
  }

  async findPromptSection(): Promise<{
    isActive: boolean;
    data: Prisma.InputJsonValue | null;
  } | null> {
    try {
      return await this.prisma.siteContent.findUnique({
        where: { section: 'ai-prompts' },
        select: { isActive: true, data: true },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch AI prompt config',
      );
    }
  }

  async findUserQuota(userId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          aiQuotaUsedTokens: true,
          aiQuotaLimitTokens: true,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user quota');
    }
  }

  async incrementUserQuota(userId: string, totalTokens: number): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          aiQuotaUsedTokens: {
            increment: totalTokens,
          },
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update user quota');
    }
  }

  async findConversationWithMessages(conversationId: string, userId: string) {
    try {
      return await this.prisma.aiConversation.findFirst({
        where: { id: conversationId, userId },
        include: aiConversationIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch conversation');
    }
  }

  async createConversation(userId: string, title: string) {
    try {
      return await this.prisma.aiConversation.create({
        data: { userId, title },
        include: aiConversationIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create conversation');
    }
  }

  async createMessage(data: {
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
    tokenUsage?: number;
  }): Promise<void> {
    try {
      await this.prisma.aiMessage.create({
        data: {
          conversationId: data.conversationId,
          role: data.role,
          content: data.content,
          tokenUsage: data.tokenUsage,
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create AI message');
    }
  }

  async findProjectsForChatContext(userId: string, role?: UserRole) {
    try {
      const projectWhere = role === UserRole.CLIENT ? { clientId: userId } : {};
      const rows = await this.prisma.project.findMany({
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
      // Pattern: Mapper — normalize Prisma Decimal → number at the boundary
      return rows.map((row) => ({
        ...row,
        budget: row.budget ? Number(row.budget) : null,
      }));
    } catch {
      throw new InternalServerErrorException('Failed to fetch chat projects');
    }
  }

  async getOperationalSnapshot(
    userId: string,
    role?: UserRole,
  ): Promise<OperationalSnapshot> {
    if (role === UserRole.CLIENT) {
      try {
        const [clientProjects, clientTasksInProgress] =
          await this.prisma.$transaction([
            this.prisma.project.count({
              where: {
                clientId: userId,
                status: {
                  in: ['PROPOSAL_SENT', 'IN_PROGRESS', 'ON_HOLD', 'REVIEW'],
                },
              },
            }),
            this.prisma.task.count({
              where: {
                project: { clientId: userId },
                status: {
                  in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'],
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
      } catch (error) {
        throw new InternalServerErrorException(
          'Failed to build operational snapshot',
        );
      }
    }

    try {
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
                in: ['PROPOSAL_SENT', 'IN_PROGRESS', 'ON_HOLD', 'REVIEW'],
              },
            },
          }),
          this.prisma.task.count({
            where: {
              status: {
                in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED'],
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
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to build operational snapshot',
      );
    }
  }

  async findProjectForProgressReport(projectId: string) {
    try {
      return await this.prisma.project.findUnique({
        where: { id: projectId },
        include: aiProgressProjectIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch project');
    }
  }

  async findProjectForStrategicPlan(projectId: string) {
    try {
      return await this.prisma.project.findUnique({
        where: { id: projectId },
        include: aiStrategicProjectIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch project');
    }
  }

  async findProjectSummary(projectId: string) {
    try {
      return await this.prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, name: true, ownerId: true, clientId: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch project');
    }
  }

  async createApplyRequest(data: Prisma.AiApplyRequestCreateInput) {
    try {
      return await this.prisma.aiApplyRequest.create({
        data,
        include: aiApplyRequestCreateIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create apply request');
    }
  }

  async listApplyRequests(status?: string) {
    try {
      return await this.prisma.aiApplyRequest.findMany({
        where: {
          ...(status
            ? { status: status as Prisma.AiApplyRequestWhereInput['status'] }
            : {}),
        },
        orderBy: { createdAt: 'desc' },
        include: aiApplyRequestListIncludes.include,
        take: 100,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to list apply requests');
    }
  }

  async findApplyRequestById(requestId: string) {
    try {
      return await this.prisma.aiApplyRequest.findUnique({
        where: { id: requestId },
        include: aiApplyRequestReviewIncludes.include,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch apply request');
    }
  }

  async updateApplyRequest(
    requestId: string,
    data: Prisma.AiApplyRequestUpdateInput,
  ): Promise<AiApplyRequest> {
    try {
      return await this.prisma.aiApplyRequest.update({
        where: { id: requestId },
        data,
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to update apply request');
    }
  }

  async findOwnerIds(): Promise<string[]> {
    try {
      const owners = await this.prisma.user.findMany({
        where: {
          role: UserRole.OWNER,
          isActive: true,
        },
        select: { id: true },
      });
      return owners.map((owner) => owner.id);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch owners');
    }
  }

  async findMilestoneTitles(projectId: string): Promise<string[]> {
    try {
      const milestones = await this.prisma.milestone.findMany({
        where: { projectId },
        select: { title: true },
      });
      return milestones.map((item) => item.title);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch milestones');
    }
  }

  async findAiTaskTitles(projectId: string): Promise<string[]> {
    try {
      const tasks = await this.prisma.task.findMany({
        where: { projectId, labels: { has: 'ai-strategy' } },
        select: { title: true },
      });
      return tasks.map((item) => item.title);
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch AI tasks');
    }
  }

  async findActiveMembers(): Promise<Array<{ id: string; role: UserRole }>> {
    try {
      return await this.prisma.user.findMany({
        where: {
          role: { in: [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER] },
          isActive: true,
        },
        select: { id: true, role: true },
      });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch members');
    }
  }

  async createMilestone(data: Prisma.MilestoneCreateInput): Promise<void> {
    try {
      await this.prisma.milestone.create({ data });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create milestone');
    }
  }

  async createTask(data: Prisma.TaskCreateInput): Promise<void> {
    try {
      await this.prisma.task.create({ data });
    } catch (error) {
      throw new InternalServerErrorException('Failed to create task');
    }
  }

  async findPublicBrandContextData(): Promise<PublicBrandContextData> {
    try {
      const [siteContents, showcaseProjects] = await this.prisma.$transaction([
        this.prisma.siteContent.findMany({
          where: {
            isActive: true,
            section: {
              in: [
                'about',
                'services',
                'portfolio',
                'founder-profile',
                'founder_cv',
              ],
            },
          },
          select: { section: true, data: true },
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

      return { siteContents, showcaseProjects };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to build public brand context',
      );
    }
  }
}
