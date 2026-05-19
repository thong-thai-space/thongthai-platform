import type { Language, User, UserRole } from '@prisma/client';

export type AuthUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'phone'
  | 'avatar'
  | 'role'
  | 'motionPreference'
  | 'password'
  | 'isActive'
  | 'emailVerified'
  | 'googleId'
  | 'emailVerifyToken'
  | 'emailVerifyTokenExpiry'
  | 'lastLoginAt'
  | 'createdAt'
  | 'updatedAt'
>;

export type PublicAuthUser = Omit<AuthUser, 'password'>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthSession {
  user: PublicAuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterCommand {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
  locale?: Language;
  turnstileToken?: string;
  remoteIp?: string;
}

export interface LoginCommand {
  email: string;
  password: string;
  turnstileToken?: string;
  remoteIp?: string;
}

export interface ForgotPasswordCommand {
  email: string;
  turnstileToken?: string;
  remoteIp?: string;
}

export interface ResetPasswordCommand {
  token: string;
  newPassword: string;
  turnstileToken?: string;
  remoteIp?: string;
}

export interface GoogleProfile {
  email: string;
  name: string;
  googleId: string;
  avatar?: string;
}

export interface ResetTokenPayload {
  sub: string;
  type: 'reset_password';
  fp: string;
}
