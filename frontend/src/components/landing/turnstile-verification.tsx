'use client';

import { useEffect, useState } from 'react';
import { TurnstileWidget } from '@/components/common/Turnstile';
import { CheckCircle, Loader } from 'lucide-react';

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

  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isVerified && !showSuccess) {
      // Smooth transition to success state
      const timer = setTimeout(() => {
        setShowSuccess(true);
        setIsVerifying(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isVerified, showSuccess]);

  if (isVerified && showSuccess) {
    return (
      <section className="border-t border-border bg-linear-to-r from-green-50 to-emerald-50 py-16">
        <div className="mx-auto max-w-md px-4 text-center sm:px-6 lg:px-8">
          <div className="animate-in fade-in zoom-in duration-500">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-green-900">
              Verification Complete
            </h2>
            <p className="text-sm text-green-700">
              You&apos;ve been verified. You can now access all our services.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-border bg-linear-to-b from-slate-900/5 to-slate-900/10 py-16">
      <div className="mx-auto max-w-md px-4 text-center sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-in fade-in duration-500">
          <div className="mb-4 flex justify-center">
            <div className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              Security Check
            </div>
          </div>
          <h2 className="mb-3 text-2xl font-bold text-slate-900">
            Verify Your Identity
          </h2>
          <p className="text-slate-600">
            Please complete the security verification to access our services.
          </p>
        </div>

        {/* Verification Container */}
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          {isVerifying ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader className="mb-3 inline-block h-6 w-6 animate-spin text-blue-600" />
                <p className="text-sm text-slate-600">Verifying your request...</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <TurnstileWidget
                siteKey={siteKey}
                onVerify={(token) => {
                  setIsVerifying(true);
                  localStorage.setItem('turnstile_token', token);
                  setIsVerified(true);
                }}
                onExpire={() => {
                  localStorage.removeItem('turnstile_token');
                  setIsVerified(false);
                }}
                onError={() => {
                  localStorage.removeItem('turnstile_token');
                  setIsVerifying(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Trust Badge */}
        <div className="mt-6 flex justify-center gap-2 text-xs text-slate-500">
          <span>🛡️</span>
          <span>Protected by Cloudflare Turnstile</span>
        </div>
      </div>
    </section>
  );
}
