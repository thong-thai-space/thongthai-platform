import { Injectable } from '@nestjs/common';
import { TurnstileService } from '../../../common/turnstile/turnstile.service';
import type { ContactSecurityChallengePort } from '../domain/contact.security-challenge.port';

// Pattern: Adapter — wraps Cloudflare Turnstile behind the ContactSecurityChallenge port
@Injectable()
export class TurnstileContactChallengeAdapter
  implements ContactSecurityChallengePort
{
  constructor(private readonly turnstile: TurnstileService) {}

  isEnabled(): boolean {
    return this.turnstile.isEnabled();
  }

  verify(token: string | undefined, remoteIp?: string): Promise<boolean> {
    if (!token) return Promise.resolve(false);
    return this.turnstile.verifyToken(token, remoteIp);
  }
}
