import { NotificationType, Prisma } from '@prisma/client';

// Pattern: Output Port
export interface TaskNotificationPort {
  create(data: {
    type: NotificationType;
    title: string;
    message: string;
    userId: string;
    data?: Prisma.InputJsonValue;
  }): Promise<unknown>;
}
