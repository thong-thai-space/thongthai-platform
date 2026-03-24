import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { ChatDto } from './dto/ai.dto';

@ApiTags('AI Public')
@Controller('ai')
export class AiPublicController {
  constructor(private aiService: AiService) {}

  @Post('chat-public')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async chatPublic(@Body() dto: ChatDto) {
    return this.aiService.chatPublic(dto.message, dto.model);
  }
}
