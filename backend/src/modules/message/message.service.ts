import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/message.dto';
import { MessageUseCases } from './use-cases/message.use-cases';

// Pattern: Facade — controllers depend on this; use cases own behavior
@Injectable()
export class MessageService {
  constructor(private readonly useCases: MessageUseCases) {}

  create(senderId: string, dto: CreateMessageDto) {
    return this.useCases.create(senderId, dto);
  }

  findConversations(userId: string) {
    return this.useCases.findConversations(userId);
  }

  findConversation(userId: string, otherUserId: string) {
    return this.useCases.findConversation(userId, otherUserId);
  }

  findProjectConversation(projectId: string, userId: string) {
    return this.useCases.findProjectConversation(projectId, userId);
  }

  markAsRead(messageId: string, userId: string) {
    return this.useCases.markAsRead(messageId, userId);
  }

  markConversationRead(userId: string, otherUserId: string) {
    return this.useCases.markConversationRead(userId, otherUserId);
  }

  markProjectConversationRead(userId: string, projectId: string) {
    return this.useCases.markProjectConversationRead(userId, projectId);
  }

  getUnreadCount(userId: string) {
    return this.useCases.getUnreadCount(userId);
  }

  getUnreadByProject(userId: string) {
    return this.useCases.getUnreadByProject(userId);
  }
}
