import { BadRequestException, Injectable } from '@nestjs/common';
import { Playbook, PlaybookStatus } from '@prisma/client';

/**
 * Pattern: Policy — guards what it takes to flip a Playbook to PUBLISHED.
 *
 * A playbook must be PUBLISHED before it can be delivered to a client
 * (enforced in AssignPlaybookUseCase), so these rules are the gate that keeps
 * half-written handbooks out of client hands.
 */
@Injectable()
export class PlaybookPublishPolicy {
  private static readonly SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  assertSlug(slug: string): void {
    if (!PlaybookPublishPolicy.SLUG_RE.test(slug)) {
      throw new BadRequestException(
        'Slug must be lowercase letters, numbers, and hyphens only',
      );
    }
  }

  assertPublishable(playbook: { title: string; contentMdx: string }): void {
    if (!playbook.title.trim()) {
      throw new BadRequestException('Cannot publish: title is required');
    }
    if (!playbook.contentMdx.trim()) {
      throw new BadRequestException('Cannot publish: content is required');
    }
  }

  /** Preserve the original publication date on re-publish; stamp "now" the first time. */
  resolvePublishedAt(playbook: Pick<Playbook, 'publishedAt' | 'status'>): Date {
    if (playbook.status === PlaybookStatus.PUBLISHED && playbook.publishedAt) {
      return playbook.publishedAt;
    }
    return new Date();
  }
}
