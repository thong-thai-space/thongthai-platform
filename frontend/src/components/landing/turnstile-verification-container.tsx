'use client';

import { useAuth } from '@/lib/auth';
import { TurnstileVerificationSection } from './turnstile-verification';

interface TurnstileVerificationContainerProps {
  siteKey?: string;
}

export function TurnstileVerificationContainer({
  siteKey,
}: TurnstileVerificationContainerProps) {
  const { user } = useAuth();

  // Only show Turnstile verification if user is NOT authenticated
  // Authenticated users don't need verification on landing page
  if (user) {
    return null;
  }

  return <TurnstileVerificationSection siteKey={siteKey} />;
}
