// Pattern: Strategy Port — pluggable bot-protection (Cloudflare Turnstile, hCaptcha, etc.)
//
// TECH DEBT: the auth module exposes the exact same port shape under
// `AUTH_SECURITY_CHALLENGE`. With two consumers now (auth + contact), this is
// the right moment per YAGNI to promote a shared
// `backend/src/common/security/` module that exports a single port + adapter
// for any module needing bot protection. Deferred to keep PR-3 surface small
// (auth has 11 dependent files; refactor risks breaking that surface in an
// autonomous run). Promote when a 3rd module needs it.
export interface ContactSecurityChallengePort {
  isEnabled(): boolean;
  verify(token: string | undefined, remoteIp?: string): Promise<boolean>;
}
