'use client';

import { useEffect, useState } from 'react';

interface DiagnosticsInfo {
  siteKeyEnv: string | undefined;
  siteKeyTrimmed: string;
  tokenInStorage: string | null;
  isVerified: boolean;
  widgetType: 'active' | 'placeholder' | 'none';
  timestamp: string;
}

export function TurnstileDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsInfo | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateDiagnostics = () => {
      const siteKeyEnv = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      const siteKeyTrimmed = siteKeyEnv?.trim() || '';
      const token = localStorage.getItem('turnstile_token');
      const isVerified = !!token;

      let widgetType: 'active' | 'placeholder' | 'none' = 'none';
      if (siteKeyTrimmed) {
        widgetType = 'active';
      } else {
        widgetType = 'placeholder';
      }

      const newDiagnostics: DiagnosticsInfo = {
        siteKeyEnv,
        siteKeyTrimmed,
        tokenInStorage: token,
        isVerified,
        widgetType,
        timestamp: new Date().toISOString(),
      };

      setDiagnostics(newDiagnostics);

      // Log to console for debugging
      console.log('[Turnstile Diagnostics]', {
        siteKeyEnv,
        siteKeyTrimmed,
        token,
        isVerified,
        widgetType,
      });
    };

    // Compute diagnostics on mount
    updateDiagnostics();

    // Also listen for storage changes
    const handleStorageChange = () => {
      updateDiagnostics();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!diagnostics) return null;

  return (
    <>
      {/* Debug Toggle Button - Bottom Right Corner */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-slate-800 px-3 py-1 text-xs text-white hover:bg-slate-900"
        title="Toggle Turnstile Diagnostics"
      >
        🔍 Turnstile Debug
      </button>

      {/* Diagnostics Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 max-w-sm rounded-lg border border-slate-300 bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Turnstile Status</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-900"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            {/* Site Key Status */}
            <div className="flex items-start justify-between">
              <span className="font-medium text-slate-700">Site Key:</span>
              <div className="text-right">
                <div
                  className={`px-2 py-1 rounded text-xs font-mono ${
                    diagnostics.siteKeyTrimmed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {diagnostics.siteKeyTrimmed
                    ? `${diagnostics.siteKeyTrimmed.substring(0, 12)}...`
                    : 'NOT SET'}
                </div>
              </div>
            </div>

            {/* Widget Type */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Widget:</span>
              <div
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  diagnostics.widgetType === 'active'
                    ? 'bg-green-100 text-green-800'
                    : diagnostics.widgetType === 'placeholder'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {diagnostics.widgetType === 'active'
                  ? '✓ ACTIVE'
                  : diagnostics.widgetType === 'placeholder'
                    ? '⏳ PLACEHOLDER'
                    : '✗ NONE'}
              </div>
            </div>

            {/* Verification Status */}
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700">Verified:</span>
              <div
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  diagnostics.isVerified
                    ? 'bg-green-100 text-green-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {diagnostics.isVerified ? '✓ YES' : '✗ NO'}
              </div>
            </div>

            {/* Token Preview */}
            {diagnostics.tokenInStorage && (
              <div className="mt-3 rounded bg-slate-100 p-2">
                <p className="text-xs font-mono text-slate-600">
                  Token (first 20 chars):
                </p>
                <p className="break-all font-mono text-xs text-slate-800">
                  {diagnostics.tokenInStorage.substring(0, 20)}...
                </p>
              </div>
            )}

            {/* Last Updated */}
            <div className="border-t border-slate-200 pt-2 text-xs text-slate-500">
              Updated: {new Date(diagnostics.timestamp).toLocaleTimeString()}
            </div>

            {/* Actions */}
            <div className="border-t border-slate-200 pt-2 space-y-1">
              <button
                onClick={() => {
                  localStorage.removeItem('turnstile_token');
                  window.location.reload();
                }}
                className="block w-full rounded bg-red-100 px-2 py-1 text-xs text-red-800 hover:bg-red-200"
              >
                Clear Token & Reload
              </button>
              <button
                onClick={() => {
                  console.log(diagnostics);
                }}
                className="block w-full rounded bg-blue-100 px-2 py-1 text-xs text-blue-800 hover:bg-blue-200"
              >
                Log to Console
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
