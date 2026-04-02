'use client';

import { useEffect, useRef } from 'react';

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
  theme?: 'auto' | 'light' | 'dark';
};

type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  className?: string;
};

export function TurnstileWidget({ onTokenChange, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '';

  useEffect(() => {
    if (!siteKey || !containerRef.current) {
      return;
    }

    let mounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const renderWidget = () => {
      if (!mounted || !containerRef.current || !window.turnstile || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onTokenChange(token),
        'expired-callback': () => onTokenChange(null),
        'error-callback': () => onTokenChange(null),
        theme: 'auto',
      });
    };

    const tryRenderWithRetry = (attempt = 0) => {
      if (!mounted || widgetIdRef.current) {
        return;
      }

      if (window.turnstile) {
        renderWidget();
        return;
      }

      if (attempt >= 20) {
        return;
      }

      retryTimer = setTimeout(() => tryRenderWithRetry(attempt + 1), 150);
    };

    const existingScript = document.getElementById(
      'cloudflare-turnstile-script',
    ) as HTMLScriptElement | null;

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'cloudflare-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => tryRenderWithRetry();
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => tryRenderWithRetry(), {
        once: true,
      });
      tryRenderWithRetry();
    }

    return () => {
      mounted = false;
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onTokenChange, siteKey]);

  if (!siteKey) {
    return null;
  }

  return <div ref={containerRef} className={className} />;
}