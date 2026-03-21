'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Zap, Eye, EyeOff, Mail } from 'lucide-react';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export default function RegisterPage() {
  const { register: authRegister, loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      await authRegister(data.name, data.email, data.password, data.acceptTerms);
      setRegisteredEmail(data.email);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Sign up failed. Please try again.');
    }
  };

  if (registeredEmail) {
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
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-7 w-7 text-primary" />
              </div>
            </div>
            <h2 className="mb-2 text-xl font-semibold">Check your email</h2>
            <p className="mb-1 text-sm text-muted-foreground">
              We sent a verification link to
            </p>
            <p className="mb-6 text-sm font-medium">{registeredEmail}</p>
            <p className="text-xs text-muted-foreground">
              Click the link in the email to activate your account. The link expires in 24 hours.
            </p>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already verified?{' '}
              <Link href="/login" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <Zap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">
              Thong Thai<span className="text-primary"> Space</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Create a new account</p>
        </div>

        <div className="rounded-xl border border-border bg-background p-6 shadow-sm">
          <button
            type="button"
            onClick={loginWithGoogle}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <span className="text-base leading-none">G</span>
            Continue with Google
          </button>

          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Full name</label>
              <input
                {...register('name', {
                  required: 'Please enter your full name',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                {...register('email', {
                  required: 'Please enter your email',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' },
                })}
                type="email"
                autoComplete="email"
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="email@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <div className="relative mt-1">
                <input
                  {...register('password', {
                    required: 'Please enter your password',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Confirm password</label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) => val === watch('password') || 'Passwords do not match',
                })}
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <label className="inline-flex items-start gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  {...register('acceptTerms', {
                    required: 'You must agree to Terms and Privacy Policy before creating an account.',
                  })}
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms-and-conditions" className="underline hover:text-foreground">
                    Terms and Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" className="underline hover:text-foreground">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-destructive">{errors.acceptTerms.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Sign up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
