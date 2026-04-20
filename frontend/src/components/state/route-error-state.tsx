'use client';

import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

type RouteErrorStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
  backHref: string;
  backLabel: string;
  showHomeIcon?: boolean;
};

export function RouteErrorState({
  title,
  message,
  onRetry,
  backHref,
  backLabel,
  showHomeIcon = false,
}: RouteErrorStateProps) {
  return (
    <div className="tts-brand-grid flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="tts-workspace-surface max-w-md w-full space-y-6 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={onRetry}
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </button>
          <Link
            href={backHref}
            className="inline-flex w-full items-center justify-center rounded-lg border border-border px-4 py-2 text-foreground hover:bg-muted"
          >
            {showHomeIcon && <Home className="mr-2 h-4 w-4" />}
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
