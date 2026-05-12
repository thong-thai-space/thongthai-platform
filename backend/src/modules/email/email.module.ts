import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';

@Module({
  providers: [EmailService, EmailTemplateService],
  exports: [EmailService],
})
export class EmailModule {}
