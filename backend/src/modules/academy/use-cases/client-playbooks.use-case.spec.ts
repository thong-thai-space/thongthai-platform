import { NotFoundException } from '@nestjs/common';
import { PlaybookAssignmentStatus } from '@prisma/client';
import { ClientPlaybooksUseCase } from './client-playbooks.use-case';
import { PlaybookProgressPolicy } from '../policies/playbook-progress.policy';
import type { AcademyRepositoryPort } from '../domain/academy.repository.port';
import type { AssignmentWithPlaybook } from '../domain/academy.types';

function buildAssignment(
  status: PlaybookAssignmentStatus,
): AssignmentWithPlaybook {
  return {
    id: 'asg_1',
    status,
    startedAt: null,
    completedAt: null,
    playbook: {
      id: 'pb_1',
      slug: 'guide',
      title: 'Guide',
      summary: null,
      contentMdx: 'body',
      tags: [],
      status: 'PUBLISHED',
      publishedAt: new Date(),
      authorId: 'user_1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}

function buildSubject(seed: AssignmentWithPlaybook | null) {
  const repo: AcademyRepositoryPort = {
    listPlaybooks: jest.fn(),
    findPlaybookById: jest.fn(),
    createPlaybook: jest.fn(),
    updatePlaybook: jest.fn(),
    deletePlaybook: jest.fn(),
    assign: jest.fn(),
    unassign: jest.fn(),
    listAssignmentsForPlaybook: jest.fn(),
    listAssignmentsForClient: jest.fn(async () => []),
    findAssignmentForClient: jest.fn(async () => seed),
    updateAssignmentProgress: jest.fn(
      async (id, data) => ({ id, ...data }) as never,
    ),
  };
  const useCase = new ClientPlaybooksUseCase(
    repo,
    new PlaybookProgressPolicy(),
  );
  return { useCase, repo };
}

describe('ClientPlaybooksUseCase', () => {
  describe('getMine — tenant isolation', () => {
    it('returns the assignment when owned by the client', async () => {
      const { useCase } = buildSubject(
        buildAssignment(PlaybookAssignmentStatus.ASSIGNED),
      );
      const result = await useCase.getMine('asg_1', 'client_1');
      expect(result.id).toBe('asg_1');
    });

    it('throws NotFound when the assignment is not owned by the client', async () => {
      // Repo returns null because the (assignmentId, clientId) pair didn't match.
      const { useCase, repo } = buildSubject(null);
      await expect(
        useCase.getMine('asg_other', 'client_1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findAssignmentForClient).toHaveBeenCalledWith(
        'asg_other',
        'client_1',
      );
    });
  });

  describe('updateProgress', () => {
    it('drives ASSIGNED → IN_PROGRESS on START', async () => {
      const { useCase, repo } = buildSubject(
        buildAssignment(PlaybookAssignmentStatus.ASSIGNED),
      );
      await useCase.updateProgress('asg_1', 'client_1', 'START');
      expect(repo.updateAssignmentProgress).toHaveBeenCalledWith(
        'asg_1',
        expect.objectContaining({
          status: PlaybookAssignmentStatus.IN_PROGRESS,
        }),
      );
    });

    it('refuses to mutate an assignment the client does not own', async () => {
      const { useCase, repo } = buildSubject(null);
      await expect(
        useCase.updateProgress('asg_other', 'client_1', 'COMPLETE'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.updateAssignmentProgress).not.toHaveBeenCalled();
    });
  });
});
