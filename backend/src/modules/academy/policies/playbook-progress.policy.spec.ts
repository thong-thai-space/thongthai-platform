import { BadRequestException } from '@nestjs/common';
import { PlaybookAssignmentStatus } from '@prisma/client';
import { PlaybookProgressPolicy } from './playbook-progress.policy';

describe('PlaybookProgressPolicy', () => {
  const policy = new PlaybookProgressPolicy();
  const now = new Date('2026-06-01T10:00:00Z');

  describe('START', () => {
    it('moves ASSIGNED → IN_PROGRESS and stamps startedAt', () => {
      const next = policy.resolve(
        PlaybookAssignmentStatus.ASSIGNED,
        'START',
        now,
      );
      expect(next).toEqual({
        status: PlaybookAssignmentStatus.IN_PROGRESS,
        startedAt: now,
      });
    });

    it('rejects starting an already IN_PROGRESS assignment', () => {
      expect(() =>
        policy.resolve(PlaybookAssignmentStatus.IN_PROGRESS, 'START', now),
      ).toThrow(BadRequestException);
    });
  });

  describe('COMPLETE', () => {
    it('moves IN_PROGRESS → COMPLETED and stamps completedAt (not startedAt)', () => {
      const next = policy.resolve(
        PlaybookAssignmentStatus.IN_PROGRESS,
        'COMPLETE',
        now,
      );
      expect(next).toEqual({
        status: PlaybookAssignmentStatus.COMPLETED,
        completedAt: now,
      });
      expect(next.startedAt).toBeUndefined();
    });

    it('allows ASSIGNED → COMPLETED directly and back-fills startedAt', () => {
      const next = policy.resolve(
        PlaybookAssignmentStatus.ASSIGNED,
        'COMPLETE',
        now,
      );
      expect(next).toEqual({
        status: PlaybookAssignmentStatus.COMPLETED,
        startedAt: now,
        completedAt: now,
      });
    });
  });

  describe('terminal state', () => {
    it('rejects any action on a COMPLETED assignment', () => {
      expect(() =>
        policy.resolve(PlaybookAssignmentStatus.COMPLETED, 'START', now),
      ).toThrow(BadRequestException);
      expect(() =>
        policy.resolve(PlaybookAssignmentStatus.COMPLETED, 'COMPLETE', now),
      ).toThrow(BadRequestException);
    });
  });
});
