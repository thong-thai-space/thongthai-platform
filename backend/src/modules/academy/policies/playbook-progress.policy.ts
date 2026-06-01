import { BadRequestException, Injectable } from '@nestjs/common';
import { PlaybookAssignmentStatus } from '@prisma/client';
import type { ProgressAction } from '../domain/academy.types';

/**
 * Pattern: State Machine — a client's progress through an assigned playbook.
 *
 *   ASSIGNED ──START──▶ IN_PROGRESS ──COMPLETE──▶ COMPLETED
 *      └──────────────────COMPLETE─────────────────▶┘
 *
 * START stamps `startedAt`; COMPLETE stamps `completedAt` (and back-fills
 * `startedAt` if the client jumped straight to done). COMPLETED is terminal.
 */
@Injectable()
export class PlaybookProgressPolicy {
  /** Returns the fields to persist for a transition, or throws if illegal. */
  resolve(
    current: PlaybookAssignmentStatus,
    action: ProgressAction,
    now: Date = new Date(),
  ): {
    status: PlaybookAssignmentStatus;
    startedAt?: Date;
    completedAt?: Date;
  } {
    if (current === PlaybookAssignmentStatus.COMPLETED) {
      throw new BadRequestException('This playbook is already completed');
    }

    if (action === 'START') {
      if (current !== PlaybookAssignmentStatus.ASSIGNED) {
        throw new BadRequestException('This playbook has already been started');
      }
      return { status: PlaybookAssignmentStatus.IN_PROGRESS, startedAt: now };
    }

    // action === 'COMPLETE' — allowed from ASSIGNED or IN_PROGRESS.
    return {
      status: PlaybookAssignmentStatus.COMPLETED,
      // Back-fill startedAt if the client never explicitly started.
      ...(current === PlaybookAssignmentStatus.ASSIGNED
        ? { startedAt: now }
        : {}),
      completedAt: now,
    };
  }
}
