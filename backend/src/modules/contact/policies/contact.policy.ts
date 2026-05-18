import { Injectable } from '@nestjs/common';

// Pattern: Policy
@Injectable()
export class ContactPolicy {
  resolveNotificationRecipients(adminIds: string[]): string[] {
    return Array.from(new Set(adminIds));
  }
}
