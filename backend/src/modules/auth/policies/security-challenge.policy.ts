import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AUTH_SECURITY_CHALLENGE } from '../auth.constants';
import type { AuthSecurityChallengePort } from '../domain/auth.security-challenge.port';

// Pattern: Policy — single chokepoint for bot-protection enforcement across use cases
@Injectable()
export class SecurityChallengePolicy {
  constructor(
    @Inject(AUTH_SECURITY_CHALLENGE)
    private readonly challenge: AuthSecurityChallengePort,
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
