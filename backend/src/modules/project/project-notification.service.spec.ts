import { Test, TestingModule } from '@nestjs/testing';
import { ProjectNotificationService } from './project-notification.service';
import { NotificationService } from '../notification/notification.service';
import { ProjectRepository } from './repositories/project.repository';

const mockNotificationService = {
  create: jest.fn(),
};

const mockRepository = {
  findActiveAdminIds: jest.fn(),
  findUserNameById: jest.fn(),
};

describe('ProjectNotificationService', () => {
  let service: ProjectNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectNotificationService,
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ProjectRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(ProjectNotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('notifyProjectCreated sends admin notifications', async () => {
    mockRepository.findActiveAdminIds.mockResolvedValue(['a1']);

    await service.notifyProjectCreated({ id: 'p1', name: 'Alpha' } as any, 'u1');
    expect(mockNotificationService.create).toHaveBeenCalled();
  });
});
