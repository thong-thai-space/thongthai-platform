'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { extractApiErrorMessage } from '@/lib/api-error';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        setStatus('success');
        setMessage('Your email has been verified successfully!');
        
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.replace('/dashboard');
        }, 3000);
      } catch (err) {
        setStatus('error');
        setMessage(extractApiErrorMessage(err, 'Verification failed. Please try again.'));
      }
    };

    verify();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center">
            <span className="text-2xl font-bold">
              Thong Thai<span className="text-primary"> Space</span>
            </span>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-background p-8 shadow-sm text-center">
          <div className="mb-4 flex justify-center">
            {status === 'verifying' && (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 animate-pulse">
                <div className="h-7 w-7 bg-primary rounded-full" />
              </div>
            )}
            {status === 'success' && (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
            )}
            {status === 'error' && (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-7 w-7 text-red-600" />
              </div>
            )}
          </div>

          <h2 className="mb-2 text-xl font-semibold">
            {status === 'verifying' && 'Verifying Email'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>

          <p className="mb-6 text-sm text-muted-foreground">{message}</p>

          {status === 'success' && (
            <p className="text-xs text-muted-foreground">
              Redirecting you to dashboard in 3 seconds...
            </p>
          )}

          {status === 'error' && (
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/register"
                className="inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Back to Sign Up
              </Link>
              <Link
                href="/login"
                className="inline-block text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Try signing in
              </Link>
            </div>
          )}
        </div>

        {status !== 'verifying' && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="text-primary hover:text-primary/80">
              Back to home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
