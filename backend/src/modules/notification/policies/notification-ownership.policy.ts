import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class NotificationOwnershipPolicy {
  assertOwned(
    notification: { userId: string },
    userId: string,
    action: string,
  ): void {
    if (notification.userId !== userId) {
      throw new ForbiddenException(
        `You do not have permission to ${action} this notification`,
      );
    }
  }
}
