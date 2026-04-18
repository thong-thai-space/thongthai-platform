export type MotionPreference = 'system' | 'on' | 'off';
export type BackendMotionPreference = 'SYSTEM' | 'ON' | 'OFF';

export const MOTION_PREFERENCE_KEY = 'tts-motion-preference';

export function getMotionPreference(): MotionPreference {
  if (typeof window === 'undefined') return 'system';

  const stored = window.localStorage.getItem(MOTION_PREFERENCE_KEY);
  if (stored === 'on' || stored === 'off' || stored === 'system') {
    return stored;
  }

  return 'system';
}

export function setMotionPreference(next: MotionPreference) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(MOTION_PREFERENCE_KEY, next);
  window.dispatchEvent(new CustomEvent('tts-motion-preference-change'));
}

export function resolveMotionEnabled(
  preference: MotionPreference,
  prefersReducedMotion: boolean,
) {
  if (preference === 'off') return false;
  if (preference === 'on') return true;
  return !prefersReducedMotion;
}

export function toBackendMotionPreference(
  preference: MotionPreference,
): BackendMotionPreference {
  if (preference === 'on') return 'ON';
  if (preference === 'off') return 'OFF';
  return 'SYSTEM';
}

export function fromBackendMotionPreference(
  preference?: string | null,
): MotionPreference {
  if (preference === 'ON') return 'on';
  if (preference === 'OFF') return 'off';
  return 'system';
}
