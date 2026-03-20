'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';

type MeResponse = {
  role?: 'OWNER' | 'ADMIN' | 'MEMBER' | 'CLIENT';
};

function resolveRedirectByRole(role?: MeResponse['role']) {
  if (role === 'CLIENT') return '/portal';
  if (role === 'MEMBER') return '/member';
  return '/dashboard';
}

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = searchParams.get('state');
  const isInvalidState = Boolean(state && state !== 'success');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isInvalidState) return;

    const handleAuth = async () => {
      try {
        const { data } = await api.get<MeResponse>('/auth/me');
        router.replace(resolveRedirectByRole(data.role));
      } catch {
        setError('Could not complete Google login. Please sign in again.');
      }
    };

    handleAuth();
  }, [isInvalidState, router]);

  const displayError = isInvalidState
    ? 'Google login failed. Please try again.'
    : error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 text-center shadow-sm">
        {displayError ? (
          <>
            <h1 className="text-lg font-semibold">Authentication Failed</h1>
            <p className="mt-2 text-sm text-muted-foreground">{displayError}</p>
            <button
              type="button"
              onClick={() => router.replace('/login')}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Signing you in...</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please wait while we complete Google authentication.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
