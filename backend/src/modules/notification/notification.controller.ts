import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    private pushService: PushService,
  ) {}

  // --- Push notification endpoints (some public) ---

  @Get('push/vapid-key')
  getVapidKey() {
    return { key: this.pushService.getVapidPublicKey() };
  }

  @Post('push/subscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  subscribe(
    @CurrentUser('id') userId: string,
    @Body() body: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    return this.pushService.subscribe(userId, body);
  }

  @Post('push/unsubscribe')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  unsubscribe(
    @CurrentUser('id') userId: string,
    @Body() body: { endpoint: string },
  ) {
    return this.pushService.unsubscribe(userId, body.endpoint);
  }

  // --- Standard notification endpoints (all JWT-guarded) ---

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  findAll(@CurrentUser('id') userId: string) {
    return this.notificationService.findByUser(userId);
  }

  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationService.remove(id, userId);
  }
}
