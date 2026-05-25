import { Prisma } from '@prisma/client';

export const taskListIncludes = Prisma.validator<Prisma.TaskDefaultArgs>()({
  include: {
    assignee: { select: { id: true, name: true, avatar: true } },
    project: { select: { id: true, name: true } },
    subTasks: { select: { id: true, title: true, status: true } },
    _count: { select: { comments: true } },
  },
});

export const taskDetailIncludes = Prisma.validator<Prisma.TaskDefaultArgs>()({
  include: {
    assignee: { select: { id: true, name: true, avatar: true } },
    creator: { select: { id: true, name: true } },
    project: { select: { id: true, name: true, clientId: true } },
    subTasks: true,
    comments: {
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    },
    timeEntries: true,
    milestone: true,
  },
});

export const taskCreateIncludes = Prisma.validator<Prisma.TaskDefaultArgs>()({
  include: {
    assignee: { select: { id: true, name: true, avatar: true } },
    project: { select: { id: true, name: true } },
  },
});

export const taskUpdateIncludes = Prisma.validator<Prisma.TaskDefaultArgs>()({
  include: {
    assignee: { select: { id: true, name: true, avatar: true } },
  },
});

export const taskAssigneeIncludes = Prisma.validator<Prisma.TaskDefaultArgs>()({
  include: {
    project: { select: { id: true, name: true } },
  },
});

export const taskCommentIncludes =
  Prisma.validator<Prisma.CommentDefaultArgs>()({
    include: {
      author: { select: { id: true, name: true, avatar: true } },
    },
  });

export type TaskListItem = Prisma.TaskGetPayload<typeof taskListIncludes>;
export type TaskWithDetails = Prisma.TaskGetPayload<typeof taskDetailIncludes>;
export type TaskWithProject = Prisma.TaskGetPayload<typeof taskCreateIncludes>;
export type TaskWithAssignee = Prisma.TaskGetPayload<typeof taskUpdateIncludes>;
export type TaskWithProjectSummary = Prisma.TaskGetPayload<
  typeof taskAssigneeIncludes
>;
export type TaskCommentWithAuthor = Prisma.CommentGetPayload<
  typeof taskCommentIncludes
>;
