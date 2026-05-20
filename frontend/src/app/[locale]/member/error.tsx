'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/state/route-error-state';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MemberErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Member Area Error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Member Area Error"
      message={error?.message || 'An error occurred. Please try again.'}
      onRetry={reset}
      backHref="/dashboard"
      backLabel="Back to Dashboard"
    />
  );
}
