'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import api from '@/lib/api';
import { extractApiErrorMessage } from '@/lib/api-error';
import { TurnstileWidget } from '@/components/security/turnstile-widget';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const hasToken = useMemo(() => token.length > 0, [token]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const isTurnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim());

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!hasToken) {
      setError('Reset token is missing or invalid. Please request a new reset link.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (isTurnstileEnabled && !turnstileToken) {
      setError('Please complete the security challenge.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        token,
        newPassword,
        turnstileToken: turnstileToken || undefined,
      });
      setMessage(
        data?.message ||
          'Password has been reset successfully. Please sign in with your new password.',
      );
      window.setTimeout(() => router.push('/login'), 1200);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Could not reset password. Please request a new reset link.'));
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
          <p className="mt-2 text-sm text-muted-foreground">Set a new password</p>
        </div>

        <div className="tts-brand-surface p-6">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">New password</label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="tts-form-field w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Confirm new password</label>
              <div className="relative mt-1">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="tts-form-field w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Update password'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Back to{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
