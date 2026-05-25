import { BadRequestException, Injectable } from '@nestjs/common';
import { ContactRequestStatus } from '@prisma/client';

/**
 * Pattern: State Machine — explicit allowed transitions for lead pipeline.
 *
 * NEW -> REVIEWED | CLOSED
 * REVIEWED -> CONTACTED | CLOSED
 * CONTACTED -> CONVERTED | CLOSED
 * CONVERTED -> CLOSED          (terminal-ish, kept reopenable to CLOSED only)
 * CLOSED -> (none, terminal)
 *
 * Keeping CLOSED terminal prevents the admin from accidentally walking a lead
 * backwards. If a CLOSED lead needs to be reopened, that should be an explicit
 * "reopen" action, not a silent status patch — out of scope for PR-4.
 */
@Injectable()
export class ContactStatusPolicy {
  private static readonly ALLOWED: Record<
    ContactRequestStatus,
    ContactRequestStatus[]
  > = {
    NEW: ['REVIEWED', 'CLOSED'],
    REVIEWED: ['CONTACTED', 'CLOSED'],
    CONTACTED: ['CONVERTED', 'CLOSED'],
    CONVERTED: ['CLOSED'],
    CLOSED: [],
  };

  assertTransition(
    from: ContactRequestStatus,
    to: ContactRequestStatus,
  ): void {
    if (from === to) {
      throw new BadRequestException(
        `Lead is already in status "${from}"`,
      );
    }
    const allowed = ContactStatusPolicy.ALLOWED[from] ?? [];
    if (!allowed.includes(to)) {
      throw new BadRequestException(
        `Cannot transition lead from ${from} to ${to}`,
      );
    }
  }
}
