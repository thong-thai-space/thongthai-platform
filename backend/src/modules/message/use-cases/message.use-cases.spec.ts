import type { MessageNotifierPort } from '../domain/message.notifier.port';
import type { MessageRealtimePort } from '../domain/message.realtime.port';
import type { MessageRepositoryPort } from '../domain/message.repository.port';
import { MessageAccessPolicy } from '../policies/message-access.policy';
import { MessageUseCases } from './message.use-cases';

function buildSut() {
  const repo: jest.Mocked<MessageRepositoryPort> = {
    createMessage: jest.fn(),
    findUserName: jest.fn().mockResolvedValue({ name: 'Sender' }),
    findProjectName: jest.fn(),
    findProjectParticipants: jest.fn(),
    findAdminIds: jest.fn().mockResolvedValue([]),
    findDistinctSentReceivers: jest.fn(),
    findDistinctReceivedSenders: jest.fn(),
    findUserSummary: jest.fn(),
    findLastMessageBetween: jest.fn(),
    countUnreadFromUser: jest.fn(),
    findConversationMessages: jest.fn(),
    findProjectById: jest.fn(),
    findUserRole: jest.fn(),
    findProjectConversationMessages: jest.fn(),
    markMessageRead: jest.fn().mockResolvedValue({ count: 1 }),
    markNotificationsReadByMessageId: jest.fn().mockResolvedValue({ count: 0 }),
    markMessagesReadFromUser: jest.fn().mockResolvedValue({ count: 0 }),
    markNotificationsReadBySenderId: jest.fn().mockResolvedValue({ count: 0 }),
    markProjectConversationRead: jest.fn(),
    countUnreadMessages: jest.fn().mockResolvedValue(0),
    findUnreadMessageNotifications: jest.fn().mockResolvedValue([]),
    findProjectsByIds: jest.fn(),
  };
  const notifier: jest.Mocked<MessageNotifierPort> = {
    notifyNewMessage: jest.fn().mockResolvedValue(undefined),
  };
  const realtime: jest.Mocked<MessageRealtimePort> = {
    pushNewMessage: jest.fn(),
  };

  const useCase = new MessageUseCases(
    repo,
    notifier,
    realtime,
    new MessageAccessPolicy(),
  );
  return { useCase, repo, notifier, realtime };
}

describe('MessageUseCases.create', () => {
  it('persists, pushes realtime event, and notifies receiver', async () => {
    const { useCase, repo, notifier, realtime } = buildSut();
    repo.createMessage.mockResolvedValue({
      id: 'm1',
      content: 'hi',
      senderId: 's1',
      receiverId: 'r1',
      projectId: null,
      createdAt: new Date(),
      isRead: false,
      sender: { id: 's1', name: 'Sender', avatar: null },
    });

    await useCase.create('s1', { content: 'hi', receiverId: 'r1' } as never);

    expect(repo.createMessage).toHaveBeenCalled();
    expect(realtime.pushNewMessage).toHaveBeenCalledWith(
      'r1',
      expect.any(Object),
    );
    expect(notifier.notifyNewMessage).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: 'r1' }),
    );
  });

  it('fans out to project participants when projectId is set', async () => {
    const { useCase, repo, notifier } = buildSut();
    repo.createMessage.mockResolvedValue({
      id: 'm1',
      content: 'hi',
      senderId: 's1',
      receiverId: 'r1',
      projectId: 'p1',
      createdAt: new Date(),
      isRead: false,
      sender: null,
    });
    repo.findProjectName.mockResolvedValue({ name: 'Proj' });
    repo.findProjectParticipants.mockResolvedValue({
      ownerId: 'owner',
      clientId: 'client',
      tasks: [{ assigneeId: 'task1' }],
    });
    repo.findAdminIds.mockResolvedValue([{ id: 'admin' }]);

    await useCase.create('s1', {
      content: 'hi',
      receiverId: 'r1',
      projectId: 'p1',
    } as never);

    const recipients = notifier.notifyNewMessage.mock.calls.map(
      (c) => c[0].recipientId,
    );
    expect(new Set(recipients)).toEqual(
      new Set(['r1', 'owner', 'client', 'task1', 'admin']),
    );
  });

  it('does not notify the sender themselves', async () => {
    const { useCase, repo, notifier } = buildSut();
    repo.createMessage.mockResolvedValue({
      id: 'm1',
      content: 'hi',
      senderId: 's1',
      receiverId: 's1',
      projectId: null,
      createdAt: new Date(),
      isRead: false,
      sender: null,
    });

    await useCase.create('s1', { content: 'hi', receiverId: 's1' } as never);
    expect(notifier.notifyNewMessage).not.toHaveBeenCalled();
  });
});

describe('MessageUseCases.findProjectConversation', () => {
  it('returns empty when project not found', async () => {
    const { useCase, repo } = buildSut();
    repo.findProjectById.mockResolvedValue(null);

    const out = await useCase.findProjectConversation('p1', 'u1');
    expect(out).toEqual([]);
  });

  it('allows project owner', async () => {
    const { useCase, repo } = buildSut();
    repo.findProjectById.mockResolvedValue({ ownerId: 'u1', clientId: 'c1' });
    repo.findProjectConversationMessages.mockResolvedValue([]);

    await useCase.findProjectConversation('p1', 'u1');
    expect(repo.findProjectConversationMessages).toHaveBeenCalledWith('p1');
  });

  it('forbids non-internal random user', async () => {
    const { useCase, repo } = buildSut();
    repo.findProjectById.mockResolvedValue({ ownerId: 'o1', clientId: 'c1' });
    repo.findUserRole.mockResolvedValue({ role: 'CLIENT' });

    await expect(
      useCase.findProjectConversation('p1', 'random'),
    ).rejects.toThrow();
  });
});

describe('MessageUseCases.getUnreadByProject', () => {
  it('aggregates counts per project', async () => {
    const { useCase, repo } = buildSut();
    repo.findUnreadMessageNotifications.mockResolvedValue([
      { data: { projectId: 'p1' } },
      { data: { projectId: 'p1' } },
      { data: { projectId: 'p2' } },
      { data: {} },
    ] as never);
    repo.findProjectsByIds.mockResolvedValue([
      { id: 'p1', name: 'One' },
      { id: 'p2', name: 'Two' },
    ]);

    const out = await useCase.getUnreadByProject('u1');
    expect(out).toEqual(
      expect.arrayContaining([
        { projectId: 'p1', projectName: 'One', count: 2 },
        { projectId: 'p2', projectName: 'Two', count: 1 },
      ]),
    );
  });
});
