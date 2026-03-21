'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';

type State = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [state, setState] = useState<State>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const token = searchParams.get('token');
    if (!token) {
      setState('error');
      setErrorMsg('No verification token found.');
      return;
    }

    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async () => {
        await refreshUser();
        setState('success');
        setTimeout(() => router.replace('/dashboard'), 2500);
      })
      .catch((err: any) => {
        const msg = err.response?.data?.message;
        setErrorMsg(msg || 'Verification failed. The link may have expired.');
        setState('error');
      });
  }, [searchParams, router, refreshUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">
              Thong Thai<span className="text-primary"> Space</span>
            </span>
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-background p-8 shadow-sm text-center">
          {state === 'loading' && (
            <>
              <div className="mb-4 flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Verifying your email…</h2>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="mb-4 flex justify-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Email verified!</h2>
              <p className="text-sm text-muted-foreground">
                Your account is now active. Redirecting to your dashboard…
              </p>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="mb-4 flex justify-center">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Verification failed</h2>
              <p className="mb-6 text-sm text-muted-foreground">{errorMsg}</p>
              <ResendSection />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ResendSection() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p className="text-sm text-muted-foreground">
        A new verification link has been sent. Check your inbox.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Enter your email to resend the link:</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@company.com"
        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        onClick={handleResend}
        disabled={loading || !email}
        className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Resend verification email'}
      </button>
      <div className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:text-primary/80">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
