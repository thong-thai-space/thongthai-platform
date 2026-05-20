'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/state/route-error-state';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PortalErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Client Portal Error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Portal Error"
      message={error?.message || 'An error occurred in your portal. Please try again.'}
      onRetry={reset}
      backHref="/portal"
      backLabel="Back to Portal"
    />
  );
}
