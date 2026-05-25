import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type TurnstileVerifyResponse = {
  success: boolean;
  'error-codes'?: string[];
};

@Injectable()
export class TurnstileService {
  constructor(private configService: ConfigService) {}

  isEnabled(): boolean {
    const secret = this.configService.get<string>('TURNSTILE_SECRET_KEY');
    return Boolean(secret && secret.trim().length > 0);
  }

  async verifyToken(token: string, remoteIp?: string): Promise<boolean> {
    const secret = this.configService
      .get<string>('TURNSTILE_SECRET_KEY')
      ?.trim();
    if (!secret) {
      return true;
    }

    const body = new URLSearchParams({
      secret,
      response: token,
    });

    if (remoteIp) {
      body.set('remoteip', remoteIp);
    }

    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      return false;
    }

    const payload = (await response.json()) as TurnstileVerifyResponse;
    return payload.success;
  }
}
