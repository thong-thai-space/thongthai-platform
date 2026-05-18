import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { TaskUseCases } from './use-cases/task.use-cases';
import { CreateTaskDto } from './dto/task.dto';
import { UserRole } from '@prisma/client';

const mockUseCases = {
  findByProject: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getMyTasks: jest.fn(),
  addComment: jest.fn(),
};

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: TaskUseCases, useValue: mockUseCases },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    jest.clearAllMocks();
  });

  describe('findByProject', () => {
    it('should delegate to use-cases', async () => {
      mockUseCases.findByProject.mockResolvedValue([]);

      await service.findByProject('project-1', 'owner-1', UserRole.OWNER);
      expect(mockUseCases.findByProject).toHaveBeenCalledWith(
        'project-1',
        'owner-1',
        UserRole.OWNER,
      );
    });
  });

  describe('create', () => {
    it('should delegate to use-cases', async () => {
      const dto = { title: 'New Task', projectId: 'p1' } as CreateTaskDto;
      mockUseCases.create.mockResolvedValue({ id: 't1' });

      await service.create(dto, 'user-1');
      expect(mockUseCases.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });
});
