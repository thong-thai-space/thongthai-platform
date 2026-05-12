import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { MessageRepository } from './repositories/message.repository';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';

const mockNotificationService = {
  create: jest.fn(),
};

const mockGateway = {
  sendToUser: jest.fn(),
};

describe('MessageService', () => {
  let service: MessageService;
  let repository: jest.Mocked<MessageRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        {
          provide: MessageRepository,
          useValue: {
            countUnreadMessages: jest.fn(),
            findDistinctSentReceivers: jest.fn(),
            findDistinctReceivedSenders: jest.fn(),
            findUserSummary: jest.fn(),
            findLastMessageBetween: jest.fn(),
            countUnreadFromUser: jest.fn(),
          },
        },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: NotificationGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get(MessageService);
    repository = module.get(MessageRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getUnreadCount uses repository', async () => {
    repository.countUnreadMessages.mockResolvedValue(3);

    await expect(service.getUnreadCount('user-1')).resolves.toBe(3);
    expect(repository.countUnreadMessages).toHaveBeenCalledWith('user-1');
  });
});
