"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSectionContent } from "@/hooks/use-content";
import { Syne } from "next/font/google";
import { useRef } from "react";

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
  onIntroVideoCompleted?: () => void;
}

export function HeroSection({ onIntroVideoCompleted }: HeroSectionProps) {
  const hasNotifiedIntroEndRef = useRef(false);

  const notifyIntroCompleted = () => {
    if (hasNotifiedIntroEndRef.current) return;
    hasNotifiedIntroEndRef.current = true;
    onIntroVideoCompleted?.();
  };

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
      <section className="relative h-[34vh] overflow-hidden bg-black sm:h-[42vh] lg:h-[56vh]">
        <video
          autoPlay
          muted
          loop
          playsInline
          onEnded={notifyIntroCompleted}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            if (!Number.isFinite(video.duration) || video.duration <= 0) return;

            // With loop enabled, onEnded is not always reliable across browsers.
            if (video.currentTime >= video.duration - 0.15) {
              notifyIntroCompleted();
            }
          }}
          className="h-full w-full scale-[1.3] object-contain"
        >
          <source
            src="/videos/video_abdeaea5-859e-4b99-8330-da037fe439e8.mp4"
            type="video/mp4"
          />
        </video>
        <div className="pointer-events-none absolute inset-0 bg-black/25" />
      </section>

      {/* Hero content block - separate section below video */}
      <section className="bg-linear-to-br from-slate-50 via-white to-blue-50/60 dark:from-background dark:via-background dark:to-primary/5">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-6">
          <div className="flex justify-center">
            <div className="max-w-3xl rounded-2xl border border-slate-200/80 bg-white/90 p-5 text-center shadow-xl backdrop-blur-md sm:p-7 dark:border-white/15 dark:bg-slate-950/35 dark:shadow-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                {c.badge}
              </div>

              {/* <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {c.title}{' '}
                <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                  {c.titleHighlight}
                </span>{' '}
                {c.titleEnd}
              </h1> */}

              <h1
                className={`${syne.className} text-xl tracking-tight text-slate-900 sm:text-2xl lg:text-3xl dark:text-white`}
              >
                {c.title}{" "}
                <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
                  {c.titleHighlight}
                </span>{" "}
                {c.titleEnd}
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-700 sm:text-xl dark:text-slate-200">
                {c.subtitle}
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href={c.primaryCta.href}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
                >
                  {c.primaryCta.text}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={c.secondaryCta.href}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-100 dark:border-white/25 dark:bg-white/5 dark:text-white dark:hover:bg-white/15"
                >
                  {c.secondaryCta.text}
                </Link>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-lg backdrop-blur-sm sm:p-6 dark:border-white/15 dark:bg-slate-950/25 dark:shadow-xl">
            <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
              {c.stats.map((stat) => (
                <div key={stat.label}>
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
