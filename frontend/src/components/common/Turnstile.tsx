'use client';

import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  siteKey?: string;
}

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  siteKey: injectedSiteKey,
}: TurnstileWidgetProps) {
  const siteKey =
    injectedSiteKey?.trim() ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ||
    '';

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