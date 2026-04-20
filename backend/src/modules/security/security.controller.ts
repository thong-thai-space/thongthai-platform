import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { VerifyTurnstileDto } from './dto/verify-turnstile.dto';
import { SecurityService } from './security.service';

@ApiTags('Security')
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

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

  @Post('turnstile/verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async verifyTurnstile(@Body() dto: VerifyTurnstileDto, @Req() req: Request) {
    const verified = await this.securityService.verifyTurnstileToken(
      dto.token,
      this.getClientIp(req),
    );

    return { verified };
  }
}
