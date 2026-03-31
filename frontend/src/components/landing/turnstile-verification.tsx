'use client';

import { useEffect, useState } from 'react';
import { TurnstileWidget } from '@/components/common/Turnstile';
import { CheckCircle } from 'lucide-react';

export function TurnstileVerificationSection() {
  const [isVerified, setIsVerified] = useState(() => {
    // Initialize state based on localStorage
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('turnstile_token');
    }
    return false;
  });

  useEffect(() => {
    // Only used to sync verification state
  }, []);

  if (isVerified) return null;

  const handleVerify = (token: string) => {
    localStorage.setItem('turnstile_token', token);
    setIsVerified(true);
  };

  return (
    <section className="border-t border-border bg-muted/50 py-12">
      <div className="mx-auto max-w-md px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-4 text-lg font-semibold">Security Verification</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Please verify that you&apos;re not a robot to access our services.
        </p>

        <div className="flex justify-center">
          <TurnstileWidget
            onVerify={handleVerify}
            onExpire={() => {
              localStorage.removeItem('turnstile_token');
              setIsVerified(false);
            }}
            onError={() => {
              localStorage.removeItem('turnstile_token');
            }}
          />
        </div>

        {isVerified && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" />
            Verification successful! You can now use our services.
          </div>
        )}
      </div>
    </section>
  );
}
