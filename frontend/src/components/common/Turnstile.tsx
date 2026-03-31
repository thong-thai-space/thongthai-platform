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
        <div className="animate-in fade-in duration-500">
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
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
          <p className="text-sm text-slate-600">
            Initializing security verification...
          </p>
        </div>
      )}
    </div>
  );
}