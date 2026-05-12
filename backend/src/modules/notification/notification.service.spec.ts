import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './notification.gateway';
import { NotificationRepository } from './repositories/notification.repository';
import { PushService } from './push.service';

const mockRepository = {
  findByUser: jest.fn(),
  findById: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  countUnread: jest.fn(),
  deleteById: jest.fn(),
  create: jest.fn(),
};

const mockGateway = {
  sendToUser: jest.fn(),
};

const mockPushService = {
  sendPush: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: mockRepository },
        { provide: NotificationGateway, useValue: mockGateway },
        { provide: PushService, useValue: mockPushService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    jest.clearAllMocks();
  });

  describe('findByUser', () => {
    it('should return latest 50 notifications for user', async () => {
      const notifications = [
        { id: 'n1', title: 'New task' },
        { id: 'n2', title: 'Invoice paid' },
      ];
      mockRepository.findByUser.mockResolvedValue(notifications);

      const result = await service.findByUser('user-1');
      expect(result).toEqual(notifications);
      expect(mockRepository.findByUser).toHaveBeenCalledWith('user-1');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'n1', userId: 'user-1' });
      mockRepository.markAsRead.mockResolvedValue({
        id: 'n1',
        isRead: true,
      });

      const result = await service.markAsRead('n1', 'user-1');
      expect(result.isRead).toBe(true);
      expect(mockRepository.markAsRead).toHaveBeenCalledWith('n1');
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockRepository.markAllAsRead.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');
      expect(result).toEqual({ count: 5 });
      expect(mockRepository.markAllAsRead).toHaveBeenCalledWith('user-1');
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockRepository.countUnread.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');
      expect(result).toBe(3);
      expect(mockRepository.countUnread).toHaveBeenCalledWith('user-1');
    });
  });

  describe('remove', () => {
    it('should delete notification', async () => {
      mockRepository.findById.mockResolvedValue({ id: 'n1', userId: 'user-1' });
      mockRepository.deleteById.mockResolvedValue({ id: 'n1' });

      const result = await service.remove('n1', 'user-1');
      expect(result).toEqual({ id: 'n1' });
    });
  });

  describe('create', () => {
    it('should create notification and push via WebSocket', async () => {
      const data = {
        type: 'TASK_ASSIGNED' as any,
        title: 'Task assigned',
        message: 'You have a new task',
        userId: 'user-1',
      };
      const created = { id: 'n1', ...data, isRead: false };
      mockRepository.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(mockRepository.create).toHaveBeenCalledWith(data);
      expect(mockGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification',
        created,
      );
      expect(mockPushService.sendPush).toHaveBeenCalledWith('user-1', {
        title: data.title,
        body: data.message,
        url: '/dashboard',
      });
    });
  });
});
