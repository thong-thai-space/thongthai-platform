import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { InvitationController } from './invitation.controller';
import { MailService } from '../../shared/mail/mail.service';

@Module({
  imports: [ConfigModule],
  controllers: [UserController, InvitationController],
  providers: [UserService, MailService],
  exports: [UserService],
})
export class UserModule {}
