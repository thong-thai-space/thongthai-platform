import { Prisma } from '@prisma/client';

export const aiConversationIncludes =
  Prisma.validator<Prisma.AiConversationDefaultArgs>()({
    include: {
      messages: { orderBy: { createdAt: 'asc' }, take: 20 },
    },
  });

export type AiConversationWithMessages = Prisma.AiConversationGetPayload<
  typeof aiConversationIncludes
>;

export const aiApplyRequestCreateIncludes =
  Prisma.validator<Prisma.AiApplyRequestDefaultArgs>()({
    include: {
      project: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true, role: true } },
    },
  });

export type AiApplyRequestWithRequester = Prisma.AiApplyRequestGetPayload<
  typeof aiApplyRequestCreateIncludes
>;

export const aiApplyRequestListIncludes =
  Prisma.validator<Prisma.AiApplyRequestDefaultArgs>()({
    include: {
      project: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true, role: true } },
      reviewer: { select: { id: true, name: true, role: true } },
    },
  });

export type AiApplyRequestWithRelations = Prisma.AiApplyRequestGetPayload<
  typeof aiApplyRequestListIncludes
>;

export const aiApplyRequestReviewIncludes =
  Prisma.validator<Prisma.AiApplyRequestDefaultArgs>()({
    include: {
      project: {
        select: { id: true, name: true, ownerId: true, clientId: true },
      },
    },
  });

export type AiApplyRequestWithProject = Prisma.AiApplyRequestGetPayload<
  typeof aiApplyRequestReviewIncludes
>;

export const aiProgressProjectIncludes =
  Prisma.validator<Prisma.ProjectDefaultArgs>()({
    include: { tasks: true, milestones: true },
  });

export type AiProgressProject = Prisma.ProjectGetPayload<
  typeof aiProgressProjectIncludes
>;

export const aiStrategicProjectIncludes =
  Prisma.validator<Prisma.ProjectDefaultArgs>()({
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
  });

export type AiStrategicProject = Prisma.ProjectGetPayload<
  typeof aiStrategicProjectIncludes
>;

export const aiAuditLogIncludes =
  Prisma.validator<Prisma.AiUsageAuditDefaultArgs>()({
    include: {
      user: { select: { id: true, name: true, role: true } },
      project: { select: { id: true, name: true } },
    },
  });

export type AiAuditLogWithRelations = Prisma.AiUsageAuditGetPayload<
  typeof aiAuditLogIncludes
>;
