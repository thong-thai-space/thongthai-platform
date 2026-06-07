import * as Sentry from '@sentry/node';

/**
 * Initializes Sentry error reporting if SENTRY_DSN is configured. Feature-gated:
 * with no DSN this is a no-op and the app runs normally (same pattern as the
 * other optional integrations). Errors-only by default — no tracing overhead.
 */
export function initSentry(): boolean {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0,
  });
  return true;
}

// Reports an exception to Sentry. Safe to call unconditionally — it's a no-op
// when Sentry was never initialized (no DSN configured).
export function captureException(error: unknown): void {
  if (!Sentry.isInitialized()) return;
  Sentry.captureException(error);
}
