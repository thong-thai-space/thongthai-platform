import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectStatus, UserRole } from '@prisma/client';
import type { ProjectRepositoryPort } from '../domain/project.repository.port';
import type { ProjectNotificationPort } from '../domain/project.notification.port';
import { ProjectStatusPolicy } from '../policies/project-status.policy';
import { ProjectUseCases } from './project.use-cases';

function buildSut() {
  const repo: jest.Mocked<ProjectRepositoryPort> = {
    findAllWithIncludes: jest.fn(),
    findByIdWithIncludes: jest.fn(),
    findById: jest.fn(),
    findByClient: jest.fn(),
    findShowcase: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findActiveAdminIds: jest.fn(),
    findUserNameById: jest.fn(),
  };
  const notifier: jest.Mocked<ProjectNotificationPort> = {
    notifyProjectCreated: jest.fn().mockResolvedValue(undefined),
    notifyProjectRequested: jest.fn().mockResolvedValue(undefined),
    notifyRequestAccepted: jest.fn().mockResolvedValue(undefined),
  };
  const useCase = new ProjectUseCases(repo, notifier, new ProjectStatusPolicy());
  return { useCase, repo, notifier };
}

describe('ProjectUseCases.findAll', () => {
  it('returns client projects for CLIENT role', async () => {
    const { useCase, repo } = buildSut();
    repo.findByClient.mockResolvedValue([] as never);
    await useCase.findAll('c1', UserRole.CLIENT);
    expect(repo.findByClient).toHaveBeenCalledWith('c1');
  });

  it('filters by assigned tasks for MEMBER role', async () => {
    const { useCase, repo } = buildSut();
    repo.findAllWithIncludes.mockResolvedValue([] as never);
    await useCase.findAll('m1', UserRole.MEMBER);
    expect(repo.findAllWithIncludes).toHaveBeenCalledWith({
      tasks: { some: { assigneeId: 'm1' } },
    });
  });

  it('scopes OWNER to projects they own (multi-tenant isolation)', async () => {
    const { useCase, repo } = buildSut();
    repo.findAllWithIncludes.mockResolvedValue([] as never);
    await useCase.findAll('o1', UserRole.OWNER);
    expect(repo.findAllWithIncludes).toHaveBeenCalledWith({ ownerId: 'o1' });
  });
});

describe('ProjectUseCases.findOne', () => {
  const project = {
    id: 'p1',
    name: 'X',
    clientId: 'c1',
    tasks: [],
  };

  it('throws NotFound for missing project', async () => {
    const { useCase, repo } = buildSut();
    repo.findByIdWithIncludes.mockResolvedValue(null);
    await expect(useCase.findOne('x', 'u', UserRole.OWNER)).rejects.toThrow(NotFoundException);
  });

  it('forbids wrong client', async () => {
    const { useCase, repo } = buildSut();
    repo.findByIdWithIncludes.mockResolvedValue(project as never);
    await expect(useCase.findOne('p1', 'other', UserRole.CLIENT)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('forbids member without assigned tasks', async () => {
    const { useCase, repo } = buildSut();
    repo.findByIdWithIncludes.mockResolvedValue(project as never);
    await expect(useCase.findOne('p1', 'm1', UserRole.MEMBER)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows correct client', async () => {
    const { useCase, repo } = buildSut();
    repo.findByIdWithIncludes.mockResolvedValue(project as never);
    const out = await useCase.findOne('p1', 'c1', UserRole.CLIENT);
    expect(out).toBe(project);
  });
});

describe('ProjectUseCases.create', () => {
  it('creates project and notifies', async () => {
    const { useCase, repo, notifier } = buildSut();
    repo.create.mockResolvedValue({ id: 'p1' } as never);

    await useCase.create(
      { name: 'X', clientId: 'c1', startDate: '2026-01-01' } as never,
      'owner-1',
    );

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'X',
        startDate: expect.any(Date),
        owner: { connect: { id: 'owner-1' } },
        client: { connect: { id: 'c1' } },
      }),
    );
    expect(notifier.notifyProjectCreated).toHaveBeenCalled();
  });
});

describe('ProjectUseCases.update', () => {
  it('enforces status transition policy', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({
      ownerId: 'owner-1',
      status: ProjectStatus.COMPLETED,
    } as never);

    await expect(
      useCase.update(
        'p1',
        { status: ProjectStatus.IN_PROGRESS } as never,
        'owner-1',
      ),
    ).rejects.toThrow(BadRequestException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('updates when transition is legal', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({
      ownerId: 'owner-1',
      status: ProjectStatus.DRAFT,
    } as never);
    repo.update.mockResolvedValue({ id: 'p1' } as never);

    await useCase.update(
      'p1',
      { status: ProjectStatus.PROPOSAL_SENT } as never,
      'owner-1',
    );
    expect(repo.update).toHaveBeenCalled();
  });

  it('rejects when caller does not own the project (cross-tenant guard)', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({
      ownerId: 'owner-1',
      status: ProjectStatus.DRAFT,
    } as never);

    await expect(
      useCase.update(
        'p1',
        { status: ProjectStatus.PROPOSAL_SENT } as never,
        'attacker',
      ),
    ).rejects.toThrow(/Forbidden/);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe('ProjectUseCases.remove', () => {
  it('rejects when caller does not own the project (cross-tenant guard)', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({ ownerId: 'owner-1' } as never);

    await expect(useCase.remove('p1', 'attacker')).rejects.toThrow(/Forbidden/);
    expect(repo.delete).not.toHaveBeenCalled();
  });

  it('deletes when caller owns the project', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({ ownerId: 'owner-1' } as never);
    repo.delete.mockResolvedValue(true as never);

    const result = await useCase.remove('p1', 'owner-1');
    expect(repo.delete).toHaveBeenCalledWith('p1');
    expect(result).toEqual({ success: true });
  });
});

describe('ProjectUseCases.acceptRequest', () => {
  it('rejects projects that are not DRAFT', async () => {
    const { useCase, repo } = buildSut();
    repo.findById.mockResolvedValue({
      status: ProjectStatus.IN_PROGRESS,
      clientId: 'c1',
    } as never);

    await expect(useCase.acceptRequest('p1', 'admin')).rejects.toThrow(BadRequestException);
  });

  it('accepts DRAFT projects and notifies', async () => {
    const { useCase, repo, notifier } = buildSut();
    repo.findById.mockResolvedValue({
      id: 'p1',
      status: ProjectStatus.DRAFT,
      clientId: 'c1',
    } as never);
    repo.update.mockResolvedValue({ id: 'p1' } as never);

    await useCase.acceptRequest('p1', 'admin');
    expect(repo.update).toHaveBeenCalled();
    expect(notifier.notifyRequestAccepted).toHaveBeenCalled();
  });
});

describe('ProjectStatusPolicy', () => {
  const policy = new ProjectStatusPolicy();

  it('allows DRAFT → PROPOSAL_SENT', () => {
    expect(() =>
      policy.assertTransition(ProjectStatus.DRAFT, ProjectStatus.PROPOSAL_SENT),
    ).not.toThrow();
  });

  it('forbids COMPLETED → anything', () => {
    expect(() =>
      policy.assertTransition(ProjectStatus.COMPLETED, ProjectStatus.IN_PROGRESS),
    ).toThrow(BadRequestException);
  });

  it('treats same status as no-op', () => {
    expect(() =>
      policy.assertTransition(ProjectStatus.IN_PROGRESS, ProjectStatus.IN_PROGRESS),
    ).not.toThrow();
  });
});
