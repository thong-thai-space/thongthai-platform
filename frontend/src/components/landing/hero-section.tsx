"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSectionContent } from "@/hooks/use-content";
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({
  weight: "400",
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

export function HeroSection() {
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
      <section className="bg-gradient-to-br from-background via-background to-primary/5">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-6">
          <div className="flex justify-center">
            <div className="max-w-3xl rounded-2xl border border-white/15 bg-slate-950/35 p-5 text-center shadow-2xl backdrop-blur-md sm:p-7">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4" />
                {c.badge}
              </div>

              {/* <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                {c.title}{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {c.titleHighlight}
                </span>{' '}
                {c.titleEnd}
              </h1> */}

              <h1
                className={`${pacifico.className} text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl`}
              >
                {c.title}{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {c.titleHighlight}
                </span>{" "}
                {c.titleEnd}
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-200 sm:text-xl">
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
                  className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  {c.secondaryCta.text}
                </Link>
              </div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-white/15 bg-slate-950/25 p-5 shadow-xl backdrop-blur-sm sm:p-6">
            <div className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
              {c.stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-primary sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-slate-200">
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
