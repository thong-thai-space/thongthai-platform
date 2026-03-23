import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

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

  @Post('submit')
  async submit(@Body() body: { token: string; ...rest }) {
  const valid = await this.turnstileService.verify(body.token)
  if (!valid) throw new UnauthorizedException('Bot detected')


}
}
