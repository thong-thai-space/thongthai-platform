import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { UserRole } from '@prisma/client';

const mockPrisma = {
  task: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockNotificationService = {
  create: jest.fn(),
};

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    jest.clearAllMocks();
  });

  describe('findByProject', () => {
    it('should return tasks for a project', async () => {
      const tasks = [
        { id: 't1', title: 'Task 1', order: 1 },
        { id: 't2', title: 'Task 2', order: 2 },
      ];
      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.findByProject(
        'project-1',
        'owner-1',
        UserRole.OWNER,
      );
      expect(result).toEqual(tasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'project-1' },
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return task with relations', async () => {
      const task = { id: 't1', title: 'Task 1', assignee: null };
      mockPrisma.task.findUnique.mockResolvedValue(task);

      const result = await service.findOne('t1');
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException for missing task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create task with creatorId', async () => {
      const dto = { title: 'New Task', projectId: 'p1' };
      const created = { id: 't1', ...dto, creatorId: 'user-1' };
      mockPrisma.task.create.mockResolvedValue(created);

      const result = await service.create(dto as any, 'user-1');
      expect(result).toEqual(created);
      expect(mockPrisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Task',
            projectId: 'p1',
            creatorId: 'user-1',
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update task', async () => {
      mockPrisma.task.findUnique.mockResolvedValue({
        id: 't1',
        title: 'Task 1',
        status: 'TODO',
        assigneeId: null,
        projectId: 'p1',
        project: { name: 'Project 1', ownerId: 'owner-1' },
      });
      const updated = { id: 't1', title: 'Updated Task' };
      mockPrisma.task.update.mockResolvedValue(updated);

      const result = await service.update('t1', {
        title: 'Updated Task',
      } as any);
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delete task', async () => {
      mockPrisma.task.delete.mockResolvedValue({ id: 't1' });

      const result = await service.remove('t1');
      expect(result).toEqual({ id: 't1' });
    });
  });

  describe('getMyTasks', () => {
    it('should return tasks assigned to user', async () => {
      const tasks = [{ id: 't1', title: 'My Task', assigneeId: 'user-1' }];
      mockPrisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.getMyTasks('user-1');
      expect(result).toEqual(tasks);
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { assigneeId: 'user-1' },
        }),
      );
    });
  });
});
