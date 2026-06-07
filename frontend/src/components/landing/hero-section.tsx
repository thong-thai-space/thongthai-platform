"use client";

/* eslint-disable @next/next/no-img-element */
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { resolveBackendAssetUrl } from "@/lib/asset-url";
import localFont from "next/font/local";

const displayFont = localFont({
  src: [
    { path: "../../../public/fonts/montserrat-800-latin.woff2", weight: "800", style: "normal" },
    { path: "../../../public/fonts/montserrat-800-latin-ext.woff2", weight: "800", style: "normal" },
    { path: "../../../public/fonts/montserrat-800-vietnamese.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
});

export function HeroSection() {
  const t = useTranslations("hero");

  const c = {
    badge: t("badge"),
    title: t("title"),
    titleHighlight: t("titleHighlight"),
    titleEnd: t("titleEnd"),
    subtitle: t("subtitle"),
    primaryCta: { text: t("primaryCta"), href: "/contact" },
    secondaryCta: { text: t("secondaryCta"), href: "/#portfolio" },
    stats: [
      { value: "50+", label: t("stats.projects") },
      { value: "30+", label: t("stats.clients") },
      { value: "5+", label: t("stats.experience") },
      { value: "99%", label: t("stats.satisfaction") },
    ],
    imageUrl: t("imageUrl") || "",
  };

  const heroImage = c.imageUrl ? resolveBackendAssetUrl(c.imageUrl) : null;

  return (
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
              className={`${displayFont.className} tts-landing-display text-3xl tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white`}
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

        {/* Optional hero image (CMS-managed) */}
        {heroImage && (
          <div className="mx-auto mt-8 max-w-5xl overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm dark:border-white/10">
            <img
              src={heroImage}
              alt={c.title}
              className="h-auto w-full object-cover"
            />
          </div>
        )}

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
  );
}
