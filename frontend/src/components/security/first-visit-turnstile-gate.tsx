'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { TurnstileWidget } from '@/components/security/turnstile-widget';
import api from '@/lib/api';

const STORAGE_KEY = 'tts-first-visit-turnstile-v1';
const VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

type GateState = 'checking' | 'challenge' | 'verifying' | 'ready';

type StoredVerification = {
  verifiedAt: number;
};

function readStoredVerification(): StoredVerification | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<StoredVerification>;
    if (typeof parsed.verifiedAt !== 'number') return null;

    return { verifiedAt: parsed.verifiedAt };
  } catch {
    return null;
  }
}

function writeStoredVerification(payload: StoredVerification) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // If storage is unavailable, user will be challenged again on next page load.
  }
}

export function FirstVisitTurnstileGate() {
  const [state, setState] = useState<GateState>('checking');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const siteKey = useMemo(
    () => process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '',
    [],
  );

  useEffect(() => {
    if (!siteKey) {
      setState('ready');
      return;
    }

    const stored = readStoredVerification();
    const now = Date.now();

    if (stored && now - stored.verifiedAt < VERIFICATION_TTL_MS) {
      setState('ready');
      return;
    }

    setState('challenge');
  }, [siteKey]);

  useEffect(() => {
    if (state === 'ready') {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, [state]);

  useEffect(() => {
    if (state !== 'challenge' || !token) return;

    let active = true;

    setState('verifying');
    setError(null);

    const verifyOnServer = async () => {
      try {
        const response = await api.post('/security/turnstile/verify', { token });
        const verified = Boolean(response.data?.verified);

        if (!active) return;

        if (!verified) {
          setToken(null);
          setError('Verification failed. Please try again.');
          setState('challenge');
          return;
        }

        writeStoredVerification({ verifiedAt: Date.now() });
        setState('ready');
      } catch {
        if (!active) return;
        setToken(null);
        setError('Unable to verify right now. Please check your connection and retry.');
        setState('challenge');
      }
    };

    void verifyOnServer();

    return () => {
      active = false;
    };
  }, [state, token]);

  if (state === 'ready') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-300 bg-white p-7 shadow-xl sm:p-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-700">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">www.thongthaispace.com</p>
            <p className="mt-1 text-sm text-slate-500">Security verification</p>
          </div>
        </div>

        <p className="text-3xl font-semibold text-slate-900">Verifying your connection</p>
        <p className="mt-3 text-lg text-slate-600">
          This website uses a security check to protect against malicious bots.
          Please complete the challenge before continuing.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-300 bg-slate-50 p-4">
          {state === 'verifying' ? (
            <p className="text-sm font-medium text-slate-600">Verification in progress...</p>
          ) : (
            <TurnstileWidget onTokenChange={setToken} className="flex justify-center" />
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <p className="mt-5 text-xs text-slate-500">
          Privacy policy and terms apply. Verification is required on first visit.
        </p>
      </div>
    </div>
  );
}
