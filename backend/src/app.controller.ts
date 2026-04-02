import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Get('healthz')
  getHealthz() {
    return {
      status: 'ok',
      service: 'backend',
      timestamp: new Date().toISOString(),
    };
  }
}

// Health check without global prefix (for orchestrators like Railway, K8s)
@Controller('api')
export class HealthCheckController {
  @Get('healthz')
  healthz() {
    return { status: 'ok', service: 'backend' };
  }
}
