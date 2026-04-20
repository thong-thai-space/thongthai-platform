import { Module } from '@nestjs/common';
import { TurnstileService } from '../../common/turnstile/turnstile.service';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

@Module({
  controllers: [SecurityController],
  providers: [SecurityService, TurnstileService],
})
export class SecurityModule {}
