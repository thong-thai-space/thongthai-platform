import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectNotificationService } from './project-notification.service';
import { UserRole, ProjectStatus } from '@prisma/client';

const mockRepository = {
  findAllWithIncludes: jest.fn(),
  findByClient: jest.fn(),
  findByIdWithIncludes: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findShowcase: jest.fn(),
};

const mockNotificationService = {
  notifyProjectCreated: jest.fn(),
  notifyProjectRequested: jest.fn(),
  notifyRequestAccepted: jest.fn(),
};

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: ProjectRepository, useValue: mockRepository },
        { provide: ProjectNotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return CLIENT projects only for CLIENT role', async () => {
      const projects = [{ id: 'p1', name: 'My Project' }];
      mockRepository.findByClient.mockResolvedValue(projects);

      const result = await service.findAll('client-1', UserRole.CLIENT);
      expect(result).toEqual(projects);
      expect(mockRepository.findByClient).toHaveBeenCalledWith('client-1');
    });

    it('should return all projects for OWNER role', async () => {
      const projects = [{ id: 'p1' }, { id: 'p2' }];
      mockRepository.findAllWithIncludes.mockResolvedValue(projects);

      const result = await service.findAll('owner-1', UserRole.OWNER);
      expect(result).toEqual(projects);
      expect(mockRepository.findAllWithIncludes).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const project = {
      id: 'p1',
      name: 'Test Project',
      clientId: 'client-1',
      tasks: [],
      milestones: [],
    };

    it('should return project for owner/admin', async () => {
      mockRepository.findByIdWithIncludes.mockResolvedValue(project);

      const result = await service.findOne('p1', 'owner-1', UserRole.OWNER);
      expect(result).toEqual(project);
    });

    it('should return project for correct CLIENT', async () => {
      mockRepository.findByIdWithIncludes.mockResolvedValue(project);

      const result = await service.findOne('p1', 'client-1', UserRole.CLIENT);
      expect(result).toEqual(project);
    });

    it('should throw ForbiddenException for wrong CLIENT', async () => {
      mockRepository.findByIdWithIncludes.mockResolvedValue(project);

      await expect(
        service.findOne('p1', 'client-2', UserRole.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent project', async () => {
      mockRepository.findByIdWithIncludes.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', 'user-1', UserRole.OWNER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create project with ownerId', async () => {
      const dto = { name: 'New Project', description: 'Desc' };
      const created = { id: 'p1', ...dto, ownerId: 'user-1' };
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(dto as any, 'user-1');
      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockNotificationService.notifyProjectCreated).toHaveBeenCalledWith(
        created,
        'user-1',
        undefined,
      );
    });

    it('should convert date strings to Date objects', async () => {
      const dto = {
        name: 'Project',
        startDate: '2026-01-01',
        endDate: '2026-06-01',
        deadline: '2026-05-15',
      };
      mockRepository.create.mockResolvedValue({ id: 'p1' });

      await service.create(dto as any, 'user-1');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: expect.any(Date),
          endDate: expect.any(Date),
          deadline: expect.any(Date),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      const updated = { id: 'p1', name: 'Updated' };
      mockRepository.findById.mockResolvedValue({ id: 'p1', status: ProjectStatus.DRAFT });
      mockRepository.update.mockResolvedValue(updated);

      const result = await service.update('p1', { name: 'Updated' } as any);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete project', async () => {
      mockRepository.delete.mockResolvedValue(true);

      const result = await service.remove('p1');
      expect(result).toEqual({ success: true });
      expect(mockRepository.delete).toHaveBeenCalledWith('p1');
    });
  });

  describe('getShowcase', () => {
    it('should return showcase projects ordered by showcaseOrder', async () => {
      const showcases = [{ id: 'p1', name: 'Showcase 1', showcaseOrder: 1 }];
      mockRepository.findShowcase.mockResolvedValue(showcases);

      const result = await service.getShowcase();
      expect(result).toEqual(showcases);
      expect(mockRepository.findShowcase).toHaveBeenCalled();
    });
  });
});
