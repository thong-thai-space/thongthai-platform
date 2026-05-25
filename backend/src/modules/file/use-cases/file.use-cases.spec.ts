import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { FileRepositoryPort } from '../domain/file.repository.port';
import type { FileStoragePort } from '../domain/file.storage.port';
import { ProjectAccessPolicy } from '../policies/project-access.policy';
import { FILE_UPLOAD_LIMITS } from '../file.constants';
import { FileUseCases } from './file.use-cases';

function buildSut() {
  const repo: jest.Mocked<FileRepositoryPort> = {
    findByProject: jest.fn(),
    findFileWithProject: jest.fn(),
    findFileProjectId: jest.fn(),
    createFile: jest.fn(),
    deleteFile: jest.fn(),
    findProjectAccess: jest.fn(),
  };
  const storage: jest.Mocked<FileStoragePort> = {
    uploadPublicFile: jest.fn().mockResolvedValue('https://cdn/example.png'),
  };
  const accessPolicy = new ProjectAccessPolicy(repo);
  return {
    useCase: new FileUseCases(repo, storage, accessPolicy),
    repo,
    storage,
  };
}

describe('FileUseCases.findOne', () => {
  it('throws NotFound for missing file', async () => {
    const { useCase, repo } = buildSut();
    repo.findFileWithProject.mockResolvedValue(null);
    await expect(useCase.findOne('f1', 'u1', UserRole.OWNER)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('allows OWNER when they own the project (multi-tenant scoped)', async () => {
    const { useCase, repo } = buildSut();
    repo.findFileWithProject.mockResolvedValue({
      id: 'f1',
      projectId: 'p1',
    } as never);
    repo.findProjectAccess.mockResolvedValue({
      ownerId: 'u1',
      clientId: null,
      tasks: [],
    });
    await useCase.findOne('f1', 'u1', UserRole.OWNER);
    expect(repo.findProjectAccess).toHaveBeenCalledWith('p1', 'u1');
  });

  it('rejects OWNER from another tenant (no global super-role)', async () => {
    const { useCase, repo } = buildSut();
    repo.findFileWithProject.mockResolvedValue({
      id: 'f1',
      projectId: 'p1',
    } as never);
    repo.findProjectAccess.mockResolvedValue({
      ownerId: 'someone-else',
      clientId: null,
      tasks: [],
    });
    await expect(useCase.findOne('f1', 'u1', UserRole.OWNER)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects CLIENT who does not own the project', async () => {
    const { useCase, repo } = buildSut();
    repo.findFileWithProject.mockResolvedValue({
      id: 'f1',
      projectId: 'p1',
    } as never);
    repo.findProjectAccess.mockResolvedValue({
      ownerId: 'o1',
      clientId: 'other',
      tasks: [],
    });

    await expect(useCase.findOne('f1', 'me', UserRole.CLIENT)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows MEMBER with assigned task', async () => {
    const { useCase, repo } = buildSut();
    repo.findFileWithProject.mockResolvedValue({
      id: 'f1',
      projectId: 'p1',
    } as never);
    repo.findProjectAccess.mockResolvedValue({
      ownerId: 'o1',
      clientId: null,
      tasks: [{ id: 't1' }],
    });

    await expect(
      useCase.findOne('f1', 'm1', UserRole.MEMBER),
    ).resolves.toBeDefined();
  });
});

describe('FileUseCases.uploadProjectFile', () => {
  function fakeFile(size = 1000): Express.Multer.File {
    return {
      originalname: 'x.png',
      mimetype: 'image/png',
      size,
      buffer: Buffer.from([]),
    } as Express.Multer.File;
  }

  it('rejects oversize files before touching storage', async () => {
    const { useCase, storage } = buildSut();
    await expect(
      useCase.uploadProjectFile({
        file: fakeFile(FILE_UPLOAD_LIMITS.MAX_BYTES + 1),
        projectId: 'p1',
        uploadedBy: 'u1',
        role: UserRole.OWNER,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(storage.uploadPublicFile).not.toHaveBeenCalled();
  });

  it('uploads then persists record on success', async () => {
    const { useCase, repo, storage } = buildSut();
    repo.findProjectAccess.mockResolvedValue({
      ownerId: 'u1',
      clientId: null,
      tasks: [],
    });
    repo.createFile.mockResolvedValue({ id: 'f-new' } as never);

    await useCase.uploadProjectFile({
      file: fakeFile(),
      projectId: 'p1',
      uploadedBy: 'u1',
      role: UserRole.OWNER,
    });

    expect(storage.uploadPublicFile).toHaveBeenCalled();
    expect(repo.createFile).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://cdn/example.png',
        project: { connect: { id: 'p1' } },
        uploadedBy: 'u1',
      }),
    );
  });
});

describe('FileUseCases.remove', () => {
  it('throws NotFound when file missing', async () => {
    const { useCase, repo } = buildSut();
    repo.findFileProjectId.mockResolvedValue(null);
    await expect(useCase.remove('f1', 'u1', UserRole.OWNER)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('deletes file after access check passes', async () => {
    const { useCase, repo } = buildSut();
    repo.findFileProjectId.mockResolvedValue({ projectId: 'p1' });
    repo.findProjectAccess.mockResolvedValue({
      ownerId: 'u1',
      clientId: null,
      tasks: [],
    });
    repo.deleteFile.mockResolvedValue({ id: 'f1' } as never);

    await useCase.remove('f1', 'u1', UserRole.OWNER);
    expect(repo.deleteFile).toHaveBeenCalledWith('f1');
  });
});
