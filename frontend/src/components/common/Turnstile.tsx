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

  return (
    <>
      {siteKey ? (
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
      ) : (
        <div className="rounded-lg border border-border bg-muted px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Security verification initializing...
          </p>
        </div>
      )}
    </>
  );
}