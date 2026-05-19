import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationRepository } from './repositories/notification.repository';
import { PushService } from './push.service';
import { NotificationOwnershipPolicy } from './policies/notification-ownership.policy';

const mockRepository = {
  findByUser: jest.fn(),
  findById: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  countUnread: jest.fn(),
  deleteById: jest.fn(),
  create: jest.fn(),
};

const mockGateway = { sendToUser: jest.fn() };
const mockPushService = { sendPush: jest.fn() };

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: mockRepository },
        { provide: NotificationGateway, useValue: mockGateway },
        { provide: PushService, useValue: mockPushService },
        NotificationOwnershipPolicy,
      ],
    }).compile();

    service = module.get(NotificationService);
    jest.clearAllMocks();
  });

  it('findByUser delegates to repository', async () => {
    mockRepository.findByUser.mockResolvedValue([{ id: 'n1' }]);
    await expect(service.findByUser('u1')).resolves.toEqual([{ id: 'n1' }]);
    expect(mockRepository.findByUser).toHaveBeenCalledWith('u1');
  });

  it('markAsRead forbids non-owner', async () => {
    mockRepository.findById.mockResolvedValue({ id: 'n1', userId: 'other' });
    await expect(service.markAsRead('n1', 'me')).rejects.toThrow(ForbiddenException);
  });

  it('markAsRead succeeds for owner', async () => {
    mockRepository.findById.mockResolvedValue({ id: 'n1', userId: 'me' });
    mockRepository.markAsRead.mockResolvedValue({ id: 'n1', isRead: true });

    const result = await service.markAsRead('n1', 'me');
    expect(result.isRead).toBe(true);
  });

  it('remove forbids non-owner', async () => {
    mockRepository.findById.mockResolvedValue({ id: 'n1', userId: 'other' });
    await expect(service.remove('n1', 'me')).rejects.toThrow(ForbiddenException);
  });

  it('create persists, broadcasts via gateway, and pushes', async () => {
    const data = {
      type: 'TASK_ASSIGNED' as never,
      title: 'New task',
      message: 'msg',
      userId: 'u1',
    };
    const created = { id: 'n1', ...data };
    mockRepository.create.mockResolvedValue(created);

    const result = await service.create(data);

    expect(result).toEqual(created);
    expect(mockGateway.sendToUser).toHaveBeenCalledWith('u1', 'notification', created);
    expect(mockPushService.sendPush).toHaveBeenCalledWith('u1', {
      title: data.title,
      body: data.message,
      url: '/dashboard',
    });
  });
});
