"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSectionContent } from "@/hooks/use-content";
import { Syne } from "next/font/google";
import { type ReactNode } from "react";

const syne = Syne({
  weight: ["700"],
  subsets: ["latin"],
  display: "swap",
});

const defaults = {
  badge: "Smart technology solutions",
  title: "Turn ideas into",
  titleHighlight: "outstanding digital",
  titleEnd: "products",
  subtitle:
    "Thong Thai Space specializes in Web & App development, AI integration, and IT consulting. Our expert team helps businesses digitize processes and achieve sustainable growth.",
  primaryCta: { text: "Get a free quote", href: "/contact" },
  secondaryCta: { text: "View our projects", href: "/portfolio" },
  stats: [
    { value: "50+", label: "Projects completed" },
    { value: "30+", label: "Trusted clients" },
    { value: "5+", label: "Years of experience" },
    { value: "99%", label: "Client satisfaction" },
  ],
};

interface HeroSectionProps {
  architectureOverlay?: ReactNode;
}

export function HeroSection({
  architectureOverlay,
}: HeroSectionProps) {
  const { data } = useSectionContent("hero");
  const raw = (data?.data as Partial<typeof defaults>) || {};
  const c = {
    ...defaults,
    ...raw,
    primaryCta: { ...defaults.primaryCta, ...raw.primaryCta },
    secondaryCta: { ...defaults.secondaryCta, ...raw.secondaryCta },
    stats: raw.stats?.length ? raw.stats : defaults.stats,
  };

  return (
    <>
      {/* Video block - separate section on top */}
      <section className="relative mx-auto h-[34vh] w-[calc(100%-3rem)] max-w-5xl sm:h-[42vh] sm:w-[calc(100%-6rem)] lg:h-[56vh] lg:w-[calc(100%-10rem)]">
        <div className="relative h-full w-full overflow-hidden rounded-4xl border border-slate-300/45 bg-black shadow-[0_10px_24px_rgba(15,23,42,0.16)] dark:border-white/10 dark:shadow-[0_10px_24px_rgba(2,6,23,0.4)]">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full scale-[1.3] object-contain"
          >
            <source
              src="/videos/video_abdeaea5-859e-4b99-8330-da037fe439e8.mp4"
              type="video/mp4"
            />
          </video>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-white/35 to-transparent dark:from-slate-950/30" />
        </div>
      </section>

      {architectureOverlay ? (
        <div className="relative z-20 mt-2 pb-4 sm:mt-3 sm:pb-5 lg:mt-4 lg:pb-6">
          {architectureOverlay}
        </div>
      ) : null}

      {/* Hero content block - separate section below video */}
      <section className="tts-premium-hero relative overflow-hidden bg-linear-to-br from-slate-50 via-white to-sky-50/70 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-500/10" />
          <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl dark:bg-amber-400/10" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-10">
          <div className="flex justify-center">
            <div className="tts-brand-surface tts-brand-grid max-w-4xl p-6 text-center sm:p-8">
              <div className="tts-brand-kicker mb-6">
                <Sparkles className="h-4 w-4" />
                {c.badge}
              </div>

              <h1
                className={`${syne.className} tts-landing-display text-3xl tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white`}
              >
                {c.title}{" "}
                <span className="bg-linear-to-r from-primary via-sky-500 to-accent bg-clip-text text-transparent">
                  {c.titleHighlight}
                </span>{" "}
                {c.titleEnd}
              </h1>

              <p className="tts-landing-subtitle tts-brand-body mx-auto mt-6 max-w-3xl text-base sm:text-lg">
                {c.subtitle}
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href={c.primaryCta.href}
                  className="tts-conversion-strong inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-[0_14px_36px_color-mix(in_srgb,var(--primary)_38%,transparent)] transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  {c.primaryCta.text}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={c.secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-white/25 dark:bg-white/5 dark:text-white dark:hover:bg-white/15"
                >
                  {c.secondaryCta.text}
                </Link>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="tts-brand-surface mx-auto mt-8 max-w-5xl p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
              {c.stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-slate-200/60 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                  <div className="text-2xl font-bold text-primary sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-200">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
