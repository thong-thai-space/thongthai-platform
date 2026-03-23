'use client';

import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!siteKey) {
    return (
      <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        Missing NEXT_PUBLIC_TURNSTILE_SITE_KEY configuration.
      </p>
    );
  }

  return (
    <Turnstile
      siteKey={siteKey}
      options={{
        theme: 'light',
        size: 'flexible',
      }}
      onSuccess={onVerify}
      onExpire={onExpire}
      onError={onError}
    />
  );
}