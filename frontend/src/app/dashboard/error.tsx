'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>

        {/* Error Message */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard Error</h2>
          <p className="mt-2 text-sm text-gray-600">
            {error?.message || 'Failed to load dashboard. Please try again.'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
