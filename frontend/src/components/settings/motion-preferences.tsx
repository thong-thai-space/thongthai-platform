'use client';

import {
  fromBackendMotionPreference,
  getMotionPreference,
  type MotionPreference,
  setMotionPreference,
  toBackendMotionPreference,
} from '@/lib/motion-settings';
import { Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';

const options: Array<{ value: MotionPreference; label: string; desc: string }> = [
  {
    value: 'system',
    label: 'System',
    desc: 'Follow your OS/browser reduced-motion preference.',
  },
  {
    value: 'on',
    label: 'Always On',
    desc: 'Enable all dynamic effects and transitions.',
  },
  {
    value: 'off',
    label: 'Off',
    desc: 'Disable dynamic effects for a static interface.',
  },
];

export function MotionPreferences() {
  const { user, refreshUser } = useAuth();
  const [preference, setPreferenceState] = useState<MotionPreference>('system');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.motionPreference) {
      setPreferenceState(fromBackendMotionPreference(user.motionPreference));
      return;
    }

    setPreferenceState(getMotionPreference());
  }, [user?.motionPreference]);

  const handleChange = async (next: MotionPreference) => {
    setPreferenceState(next);
    setMotionPreference(next);

    if (!user) return;

    setSaving(true);
    try {
      await api.patch('/users/me', {
        motionPreference: toBackendMotionPreference(next),
      });
      await refreshUser();
    } catch {
      // Keep local preference applied even if sync request fails.
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-background p-4 sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Motion Preferences</h3>
          <p className="text-xs text-muted-foreground">
            Control page transitions, micro-interactions, cursor effects and smooth scrolling.
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => {
          const active = preference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => void handleChange(option.value)}
              disabled={saving}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border hover:bg-muted/40'
              }`}
            >
              <p className="text-sm font-medium">{option.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{option.desc}</p>
            </button>
          );
        })}
      </div>
      {saving && <p className="mt-2 text-xs text-muted-foreground">Syncing preference...</p>}
    </section>
  );
}
