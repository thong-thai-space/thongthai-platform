'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PortalErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Client Portal Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Portal Error</h2>
          <p className="mt-2 text-sm text-gray-600">
            {error?.message || 'An error occurred in your portal. Please try again.'}
          </p>
        </div>
        <div className="space-y-2">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
          <Link
            href="/portal"
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Back to Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
