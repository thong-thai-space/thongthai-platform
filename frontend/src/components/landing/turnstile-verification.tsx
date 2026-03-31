'use client';

import { useState } from 'react';
import { TurnstileWidget } from '@/components/common/Turnstile';
import { CheckCircle } from 'lucide-react';

interface TurnstileVerificationSectionProps {
  siteKey?: string;
}

export function TurnstileVerificationSection({
  siteKey,
}: TurnstileVerificationSectionProps) {
  const [isVerified, setIsVerified] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('turnstile_token');
    }
    return false;
  });

  return (
    <section className="border-t border-border bg-muted/40 py-12">
      <div className="mx-auto max-w-xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="mb-2 text-3xl font-bold tracking-tight">Security Verification</h2>
          <p className="text-muted-foreground">
            Please verify that you&apos;re not a robot to access our services.
          </p>
        </div>

        <div className="mx-auto max-w-sm rounded-xl border border-border bg-background p-4 shadow-sm">
          <TurnstileWidget
            siteKey={siteKey}
            onVerify={(token) => {
              localStorage.setItem('turnstile_token', token);
              setIsVerified(true);
            }}
            onExpire={() => {
              localStorage.removeItem('turnstile_token');
              setIsVerified(false);
            }}
            onError={() => {
              localStorage.removeItem('turnstile_token');
              setIsVerified(false);
            }}
          />
        </div>

        {isVerified ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs text-green-700">
            <CheckCircle className="h-4 w-4" />
            Verified
          </div>
        ) : null}
      </div>
    </section>
  );
}
