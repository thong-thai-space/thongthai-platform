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

  // Don't render widget if key is not configured
  // When key becomes available (e.g., after Railway env setup), it will appear
  if (!siteKey) {
    return null;
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