'use client';

interface SectionDividerProps {
  tone?: 'primary' | 'accent';
}

export function SectionDivider({ tone = 'primary' }: SectionDividerProps) {
  const beamClass = tone === 'accent' ? 'tts-divider-beam-accent' : 'tts-divider-beam-primary';

  return (
    <div className="tts-section-divider" aria-hidden="true">
      <svg
        className="tts-section-divider-svg"
        viewBox="0 0 1200 140"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="tts-divider-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(37,99,235,0)" />
            <stop offset="28%" stopColor="rgba(37,99,235,0.35)" />
            <stop offset="72%" stopColor="rgba(14,165,233,0.35)" />
            <stop offset="100%" stopColor="rgba(14,165,233,0)" />
          </linearGradient>
        </defs>
        <path
          className={`tts-divider-path ${beamClass}`}
          d="M0 70 C 190 20, 420 120, 600 70 C 790 20, 1000 120, 1200 70"
          fill="none"
          stroke="url(#tts-divider-gradient)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
