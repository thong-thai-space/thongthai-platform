'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { extractApiErrorMessage } from '@/lib/api-error';
import { Mail, Send } from 'lucide-react';
import { TurnstileWidget } from '@/components/security/turnstile-widget';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const isTurnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (isTurnstileEnabled && !turnstileToken) {
      setError('Please complete the security challenge.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: email.trim(),
        turnstileToken: turnstileToken || undefined,
      });
      setMessage(
        data?.message ||
          'If that email is registered, you will receive password reset instructions shortly.',
      );
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not process your request right now. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tts-brand-grid flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center">
            <span className="text-2xl font-bold">
              Thong Thai<span className="text-primary"> Space</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Reset your password</p>
        </div>

        <div className="tts-brand-surface p-6">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-6 w-6" />
            </div>
          </div>

          <p className="tts-brand-body mb-4 text-sm text-center">
            Enter your email and we will send you a secure reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="email@company.com"
                className="tts-form-field mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                {message}
              </div>
            )}

            <TurnstileWidget onTokenChange={setTurnstileToken} className="flex justify-center" />

            <button
              type="submit"
              disabled={isSubmitting || (isTurnstileEnabled && !turnstileToken)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
