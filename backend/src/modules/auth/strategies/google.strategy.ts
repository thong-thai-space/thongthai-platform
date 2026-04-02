import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';

export type GoogleAuthUser = {
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    const backendBaseUrl =
      configService.get('BACKEND_URL') ||
      `http://localhost:${configService.get('PORT') || '4000'}`;

    super({
      clientID: configService.get('GOOGLE_CLIENT_ID') || 'disabled',
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET') || 'disabled',
      callbackURL:
        configService.get('GOOGLE_CALLBACK_URL') ||
        `${backendBaseUrl}/api/v1/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): GoogleAuthUser {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    if (!email) {
      throw new Error('Google account does not provide a valid email');
    }

    return {
      email,
      name: profile.displayName || email.split('@')[0] || 'Google User',
      avatar: profile.photos?.[0]?.value,
      googleId: profile.id,
    };
  }
}
