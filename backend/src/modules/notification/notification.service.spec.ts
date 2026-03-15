import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';

const mockPrisma = {
  notification: {
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  },
};

const mockGateway = {
  sendToUser: jest.fn(),
};

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationGateway, useValue: mockGateway },
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
      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await service.findByUser('user-1');
      expect(result).toEqual(notifications);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.update.mockResolvedValue({
        id: 'n1',
        isRead: true,
      });

      const result = await service.markAsRead('n1');
      expect(result.isRead).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.markAllAsRead('user-1');
      expect(result).toEqual({ count: 5 });
      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrisma.notification.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1');
      expect(result).toBe(3);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });
  });

  describe('remove', () => {
    it('should delete notification', async () => {
      mockPrisma.notification.delete.mockResolvedValue({ id: 'n1' });

      const result = await service.remove('n1');
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
      mockPrisma.notification.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({ data });
      expect(mockGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification',
        created,
      );
    });
  });
});
