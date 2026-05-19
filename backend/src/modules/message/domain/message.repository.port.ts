import type { Prisma } from '@prisma/client';

export interface MessageRepositoryPort {
  createMessage(data: Prisma.MessageUncheckedCreateInput): Promise<{
    id: string;
    content: string;
    senderId: string;
    receiverId: string | null;
    projectId: string | null;
    createdAt: Date;
    isRead: boolean;
    sender: { id: string; name: string | null; avatar: string | null } | null;
  }>;

  findUserName(userId: string): Promise<{ name: string | null } | null>;
  findProjectName(projectId: string): Promise<{ name: string } | null>;
  findProjectParticipants(projectId: string): Promise<{
    ownerId: string | null;
    clientId: string | null;
    tasks: { assigneeId: string | null }[];
  } | null>;
  findAdminIds(): Promise<{ id: string }[]>;

  findDistinctSentReceivers(userId: string): Promise<{ receiverId: string | null }[]>;
  findDistinctReceivedSenders(userId: string): Promise<{ senderId: string }[]>;

  findUserSummary(userId: string): Promise<unknown>;
  findLastMessageBetween(userId: string, otherUserId: string): Promise<{ createdAt: Date } | null>;
  countUnreadFromUser(senderId: string, receiverId: string): Promise<number>;

  findConversationMessages(userId: string, otherUserId: string): Promise<unknown[]>;
  findProjectById(projectId: string): Promise<{ ownerId: string | null; clientId: string | null } | null>;
  findUserRole(userId: string): Promise<{ role: string } | null>;
  findProjectConversationMessages(projectId: string): Promise<unknown[]>;

  markMessageRead(messageId: string, userId: string): Promise<{ count: number }>;
  markNotificationsReadByMessageId(userId: string, messageId: string): Promise<{ count: number }>;
  markMessagesReadFromUser(otherUserId: string, userId: string): Promise<{ count: number }>;
  markNotificationsReadBySenderId(userId: string, otherUserId: string): Promise<{ count: number }>;
  markProjectConversationRead(userId: string, projectId: string): Promise<{ count: number }>;
  countUnreadMessages(userId: string): Promise<number>;

  findUnreadMessageNotifications(userId: string): Promise<{ data: Prisma.JsonValue }[]>;
  findProjectsByIds(projectIds: string[]): Promise<{ id: string; name: string }[]>;
}
