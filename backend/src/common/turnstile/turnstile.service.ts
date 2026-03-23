import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);

  constructor(private readonly configService: ConfigService) {}

  async verify(token: string, remoteIp?: string): Promise<boolean> {
    if (!token) {
      return false;
    }

    const secret = this.configService.get<string>('TURNSTILE_SECRET_KEY');
    if (!secret) {
      this.logger.error('TURNSTILE_SECRET_KEY is not configured');
      return false;
    }

    const body = new URLSearchParams({
      secret,
      response: token,
    });
    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    try {
      const res = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        },
      );

      const data = (await res.json()) as {
        success?: boolean;
        ['error-codes']?: string[];
      };

      if (!data.success) {
        this.logger.warn(
          `Turnstile verification failed${data['error-codes']?.length ? `: ${data['error-codes'].join(', ')}` : ''}`,
        );
      }

      return data.success === true;
    } catch (error) {
      this.logger.error('Turnstile verification request failed', error);
      return false;
    }
  }
}