// Pattern: Strategy Port — pluggable bot-protection (Cloudflare Turnstile, hCaptcha, etc.)
export interface AuthSecurityChallengePort {
  isEnabled(): boolean;
  verify(token: string | undefined, remoteIp?: string): Promise<boolean>;
}
