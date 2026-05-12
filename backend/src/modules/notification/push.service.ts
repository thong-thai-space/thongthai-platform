import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';
import { PushRepository } from './repositories/push.repository';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly vapidConfigured: boolean;

  constructor(
    private pushRepository: PushRepository,
    private configService: ConfigService,
  ) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT');

    if (publicKey && privateKey && subject) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('Web Push VAPID configured');
    } else {
      this.vapidConfigured = false;
      this.logger.warn('Web Push VAPID not configured — push notifications disabled');
    }
  }

  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    return this.pushRepository.upsertSubscription(userId, subscription);
  }

  async unsubscribe(userId: string, endpoint: string) {
    return this.pushRepository.deleteSubscription(userId, endpoint);
  }

  async sendPush(userId: string, payload: { title: string; body: string; url?: string }) {
    if (!this.vapidConfigured) return;

    const subscriptions = await this.pushRepository.findSubscriptions(userId);

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        ),
      ),
    );

    // Remove expired/invalid subscriptions
    const toRemove: string[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const statusCode = (result.reason as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          toRemove.push(subscriptions[index].id);
        } else {
          this.logger.warn(`Push to ${subscriptions[index].endpoint} failed: ${result.reason}`);
        }
      }
    });

    if (toRemove.length > 0) {
      await this.pushRepository.deleteSubscriptionsByIds(toRemove);
      this.logger.log(`Removed ${toRemove.length} expired push subscriptions`);
    }
  }

  getVapidPublicKey(): string | null {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || null;
  }
}
