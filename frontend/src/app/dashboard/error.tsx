'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/state/route-error-state';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Pattern: Error Boundary
 * Error handler for dashboard route
 */
export default function DashboardErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Dashboard Error"
      message={error?.message || 'Failed to load dashboard. Please try again.'}
      onRetry={reset}
      backHref="/"
      backLabel="Back to Home"
      showHomeIcon
    />
  );
}
