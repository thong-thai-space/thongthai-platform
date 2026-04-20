import { Injectable } from '@nestjs/common';
import { TurnstileService } from '../../common/turnstile/turnstile.service';

@Injectable()
export class SecurityService {
  constructor(private readonly turnstileService: TurnstileService) {}

  // Pattern: Facade
  async verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
    return this.turnstileService.verifyToken(token, remoteIp);
  }
}
