import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { PushService } from './push.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationRepository } from './repositories/notification.repository';
import { PushRepository } from './repositories/push.repository';
import { NotificationOwnershipPolicy } from './policies/notification-ownership.policy';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    PushService,
    NotificationRepository,
    PushRepository,
    NotificationOwnershipPolicy,
  ],
  exports: [NotificationService, NotificationGateway, PushService],
})
export class NotificationModule {}
