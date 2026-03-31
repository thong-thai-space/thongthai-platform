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
    <div className="w-full">
      {siteKey ? (
        <div className="flex justify-center">
          <Turnstile
            siteKey={siteKey}
            options={{
              theme: 'light',
              size: 'normal',
            }}
            onSuccess={onVerify}
            onExpire={onExpire}
            onError={onError}
          />
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-5 text-center">
          <p className="text-sm text-muted-foreground">
            Dang xac minh...
          </p>
        </div>
      )}
    </div>
  );
}