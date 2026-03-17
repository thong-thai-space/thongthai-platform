import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/message.dto';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.messageService.create(userId, dto);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.messageService.getUnreadCount(userId);
  }

  @Get('unread-by-project')
  getUnreadByProject(@CurrentUser('id') userId: string) {
    return this.messageService.getUnreadByProject(userId);
  }

  @Get('conversations')
  findConversations(@CurrentUser('id') userId: string) {
    return this.messageService.findConversations(userId);
  }

  @Get('project/:projectId')
  findProjectConversation(
    @Param('projectId') projectId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messageService.findProjectConversation(projectId, userId);
  }

  @Get('conversation/:userId')
  findConversation(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') otherUserId: string,
  ) {
    return this.messageService.findConversation(currentUserId, otherUserId);
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.messageService.markAsRead(id, userId);
  }

  @Patch('read-all/:userId')
  markConversationRead(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') otherUserId: string,
  ) {
    return this.messageService.markConversationRead(currentUserId, otherUserId);
  }

  @Patch('project/:projectId/read')
  markProjectConversationRead(
    @CurrentUser('id') userId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.messageService.markProjectConversationRead(userId, projectId);
  }
}
