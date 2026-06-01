import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Playbook, PlaybookStatus } from '@prisma/client';
import { AssignPlaybookUseCase } from './assign-playbook.use-case';
import type { AcademyRepositoryPort } from '../domain/academy.repository.port';

function buildPlaybook(status: PlaybookStatus): Playbook {
  return {
    id: 'pb_1',
    slug: 'guide',
    title: 'Guide',
    summary: null,
    contentMdx: 'body',
    tags: [],
    status,
    publishedAt: status === PlaybookStatus.PUBLISHED ? new Date() : null,
    authorId: 'user_1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function buildSubject(seed: Playbook | null) {
  const repo: AcademyRepositoryPort = {
    listPlaybooks: jest.fn(),
    findPlaybookById: jest.fn(async () => seed),
    createPlaybook: jest.fn(),
    updatePlaybook: jest.fn(),
    deletePlaybook: jest.fn(),
    assign: jest.fn(async () => ({}) as never),
    unassign: jest.fn(async () => undefined),
    listAssignmentsForPlaybook: jest.fn(async () => []),
    listAssignmentsForClient: jest.fn(),
    findAssignmentForClient: jest.fn(),
    updateAssignmentProgress: jest.fn(),
  };
  return { useCase: new AssignPlaybookUseCase(repo), repo };
}

describe('AssignPlaybookUseCase', () => {
  it('assigns a PUBLISHED playbook to a client', async () => {
    const { useCase, repo } = buildSubject(
      buildPlaybook(PlaybookStatus.PUBLISHED),
    );
    await useCase.assign('pb_1', 'client_1', 'staff_1');
    expect(repo.assign).toHaveBeenCalledWith('pb_1', 'client_1', 'staff_1');
  });

  it('refuses to assign a DRAFT playbook', async () => {
    const { useCase, repo } = buildSubject(buildPlaybook(PlaybookStatus.DRAFT));
    await expect(
      useCase.assign('pb_1', 'client_1', 'staff_1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.assign).not.toHaveBeenCalled();
  });

  it('refuses to assign an ARCHIVED playbook', async () => {
    const { useCase, repo } = buildSubject(
      buildPlaybook(PlaybookStatus.ARCHIVED),
    );
    await expect(
      useCase.assign('pb_1', 'client_1', 'staff_1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.assign).not.toHaveBeenCalled();
  });

  it('throws NotFound when the playbook does not exist', async () => {
    const { useCase } = buildSubject(null);
    await expect(
      useCase.assign('missing', 'client_1', 'staff_1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lists assignees only for an existing playbook', async () => {
    const { useCase, repo } = buildSubject(
      buildPlaybook(PlaybookStatus.PUBLISHED),
    );
    await useCase.listAssignees('pb_1');
    expect(repo.listAssignmentsForPlaybook).toHaveBeenCalledWith('pb_1');
  });
});
