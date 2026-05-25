import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CONTACT_SECURITY_CHALLENGE } from '../contact.constants';
import type { ContactSecurityChallengePort } from '../domain/contact.security-challenge.port';

// Pattern: Policy — single chokepoint for bot-protection enforcement on contact submissions.
// When TURNSTILE_SECRET_KEY is unset (local/dev), `isEnabled()` returns false and the policy
// is a no-op — keeping the dev loop fast while making production hardening a one-env-var flip.
@Injectable()
export class ContactSecurityChallengePolicy {
  constructor(
    @Inject(CONTACT_SECURITY_CHALLENGE)
    private readonly challenge: ContactSecurityChallengePort,
  ) {}

  async enforce(token: string | undefined, remoteIp?: string): Promise<void> {
    if (!this.challenge.isEnabled()) {
      return;
    }

    if (!token) {
      throw new BadRequestException('Please complete the security challenge');
    }

    const valid = await this.challenge.verify(token, remoteIp);
    if (!valid) {
      throw new UnauthorizedException('Security challenge validation failed');
    }
  }
}
