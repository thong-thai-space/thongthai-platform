import type { Prisma } from '@prisma/client';

export interface MessageNotifierPort {
  notifyNewMessage(input: {
    recipientId: string;
    title: string;
    body: string;
    metadata: Prisma.InputJsonValue;
  }): Promise<void>;
}
