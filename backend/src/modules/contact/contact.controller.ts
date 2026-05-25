import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { UserRole } from '@prisma/client';
import { ContactService } from './contact.service';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { ListLeadsQueryDto } from './dto/list-leads.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { Roles } from '../../shared/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private contactService: ContactService) {}

  private getClientIp(req: Request): string | undefined {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0]?.trim();
    }
    if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
      return forwardedFor[0];
    }
    return req.ip;
  }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  create(@Body() dto: CreateContactRequestDto, @Req() req: Request) {
    return this.contactService.create(dto, this.getClientIp(req));
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  list(@Query() query: ListLeadsQueryDto) {
    return this.contactService.list(query);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.contactService.updateStatus(id, dto.status);
  }
}
