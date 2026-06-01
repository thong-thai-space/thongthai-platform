import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Playbook, PlaybookStatus } from '@prisma/client';
import { PlaybookAdminUseCases } from './playbook-admin.use-cases';
import { PlaybookPublishPolicy } from '../policies/playbook-publish.policy';
import type { AcademyRepositoryPort } from '../domain/academy.repository.port';

// Pattern: Unit test against the port — fake repository, real policy + use-case.

function buildPlaybook(overrides: Partial<Playbook> = {}): Playbook {
  return {
    id: 'pb_1',
    slug: 'guide',
    title: 'Guide',
    summary: null,
    contentMdx: 'body',
    tags: [],
    status: PlaybookStatus.DRAFT,
    publishedAt: null,
    authorId: 'user_1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function buildSubject(seed?: Playbook | null) {
  const repo: AcademyRepositoryPort = {
    listPlaybooks: jest.fn(),
    findPlaybookById: jest.fn(async () => seed ?? null),
    createPlaybook: jest.fn(async (data) =>
      buildPlaybook(data as Partial<Playbook>),
    ),
    updatePlaybook: jest.fn(async (id, data) =>
      buildPlaybook({ id, ...(data as object) }),
    ),
    deletePlaybook: jest.fn(async () => undefined),
    assign: jest.fn(),
    unassign: jest.fn(),
    listAssignmentsForPlaybook: jest.fn(),
    listAssignmentsForClient: jest.fn(),
    findAssignmentForClient: jest.fn(),
    updateAssignmentProgress: jest.fn(),
  };
  const useCase = new PlaybookAdminUseCases(repo, new PlaybookPublishPolicy());
  return { useCase, repo };
}

describe('PlaybookAdminUseCases', () => {
  describe('create', () => {
    it('creates a DRAFT playbook with a connected author and validated slug', async () => {
      const { useCase, repo } = buildSubject();
      await useCase.create(
        { title: 'Guide', slug: 'guide', contentMdx: 'body' },
        'author_1',
      );
      expect(repo.createPlaybook).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PlaybookStatus.DRAFT,
          author: { connect: { id: 'author_1' } },
        }),
      );
    });

    it('rejects an invalid slug before touching the repo', async () => {
      const { useCase, repo } = buildSubject();
      await expect(
        useCase.create(
          { title: 'Guide', slug: 'Not A Slug', contentMdx: 'body' },
          'author_1',
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.createPlaybook).not.toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('throws NotFound when the playbook is missing', async () => {
      const { useCase } = buildSubject(null);
      await expect(useCase.getById('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('publish', () => {
    it('publishes a valid draft and stamps publishedAt', async () => {
      const { useCase, repo } = buildSubject(buildPlaybook());
      await useCase.publish('pb_1');
      expect(repo.updatePlaybook).toHaveBeenCalledWith(
        'pb_1',
        expect.objectContaining({ status: PlaybookStatus.PUBLISHED }),
      );
    });

    it('refuses to publish a playbook with empty content', async () => {
      const { useCase, repo } = buildSubject(
        buildPlaybook({ contentMdx: '  ' }),
      );
      await expect(useCase.publish('pb_1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.updatePlaybook).not.toHaveBeenCalled();
    });
  });

  describe('archive', () => {
    it('sets status to ARCHIVED', async () => {
      const { useCase, repo } = buildSubject(buildPlaybook());
      await useCase.archive('pb_1');
      expect(repo.updatePlaybook).toHaveBeenCalledWith('pb_1', {
        status: PlaybookStatus.ARCHIVED,
      });
    });
  });
});
