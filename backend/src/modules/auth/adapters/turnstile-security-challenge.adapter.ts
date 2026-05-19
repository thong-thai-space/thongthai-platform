import { Injectable } from '@nestjs/common';
import { TurnstileService } from '../../../common/turnstile/turnstile.service';
import { AuthSecurityChallengePort } from '../domain/auth.security-challenge.port';

// Pattern: Adapter — wraps Cloudflare Turnstile behind the SecurityChallenge port
@Injectable()
export class TurnstileSecurityChallengeAdapter implements AuthSecurityChallengePort {
  constructor(private readonly turnstile: TurnstileService) {}

  isEnabled(): boolean {
    return this.turnstile.isEnabled();
  }

  verify(token: string | undefined, remoteIp?: string): Promise<boolean> {
    if (!token) return Promise.resolve(false);
    return this.turnstile.verifyToken(token, remoteIp);
  }
}
