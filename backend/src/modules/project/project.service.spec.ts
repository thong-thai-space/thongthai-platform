import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { UserRole } from '@prisma/client';

const mockPrisma = {
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
};

const mockNotificationService = {
  create: jest.fn(),
};

describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return CLIENT projects only for CLIENT role', async () => {
      const projects = [{ id: 'p1', name: 'My Project' }];
      mockPrisma.project.findMany.mockResolvedValue(projects);

      const result = await service.findAll('client-1', UserRole.CLIENT);
      expect(result).toEqual(projects);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientId: 'client-1' },
        }),
      );
    });

    it('should return all projects for OWNER role', async () => {
      const projects = [{ id: 'p1' }, { id: 'p2' }];
      mockPrisma.project.findMany.mockResolvedValue(projects);

      const result = await service.findAll('owner-1', UserRole.OWNER);
      expect(result).toEqual(projects);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            client: expect.any(Object),
          }),
        }),
      );
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
      mockPrisma.project.findUnique.mockResolvedValue(project);

      const result = await service.findOne('p1', 'owner-1', UserRole.OWNER);
      expect(result).toEqual(project);
    });

    it('should return project for correct CLIENT', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(project);

      const result = await service.findOne('p1', 'client-1', UserRole.CLIENT);
      expect(result).toEqual(project);
    });

    it('should throw ForbiddenException for wrong CLIENT', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(project);

      await expect(
        service.findOne('p1', 'client-2', UserRole.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent', 'user-1', UserRole.OWNER),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create project with ownerId', async () => {
      const dto = { name: 'New Project', description: 'Desc' };
      const created = { id: 'p1', ...dto, ownerId: 'user-1' };
      mockPrisma.project.create.mockResolvedValue(created);
      mockPrisma.user.findMany.mockResolvedValue([]);

      const result = await service.create(dto as any, 'user-1');
      expect(result).toEqual(created);
      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: 'user-1' }),
        }),
      );
    });

    it('should convert date strings to Date objects', async () => {
      const dto = {
        name: 'Project',
        startDate: '2026-01-01',
        endDate: '2026-06-01',
        deadline: '2026-05-15',
      };
      mockPrisma.project.create.mockResolvedValue({ id: 'p1' });
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.create(dto as any, 'user-1');
      expect(mockPrisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            startDate: expect.any(Date),
            endDate: expect.any(Date),
            deadline: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      const updated = { id: 'p1', name: 'Updated' };
      mockPrisma.project.update.mockResolvedValue(updated);

      const result = await service.update('p1', { name: 'Updated' } as any);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete project', async () => {
      mockPrisma.project.delete.mockResolvedValue({ id: 'p1' });

      const result = await service.remove('p1');
      expect(result).toEqual({ id: 'p1' });
      expect(mockPrisma.project.delete).toHaveBeenCalledWith({
        where: { id: 'p1' },
      });
    });
  });

  describe('getShowcase', () => {
    it('should return showcase projects ordered by showcaseOrder', async () => {
      const showcases = [{ id: 'p1', name: 'Showcase 1', showcaseOrder: 1 }];
      mockPrisma.project.findMany.mockResolvedValue(showcases);

      const result = await service.getShowcase();
      expect(result).toEqual(showcases);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isShowcase: true },
          orderBy: { showcaseOrder: 'asc' },
        }),
      );
    });
  });
});
