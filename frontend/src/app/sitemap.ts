import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://thongthaispace.com";

// Public routes (relative to locale prefix).
const PUBLIC_ROUTES = [
  "",
  "/about",
  "/services",
  "/portfolio",
  "/contact",
  "/privacy-policy",
  "/terms-and-conditions",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

/**
 * Build a locale-prefixed path that matches next-intl's `as-needed` strategy.
 * The default locale (vi) is exposed without a prefix; other locales get `/en/...`.
 */
function localizedPath(locale: string, path: string): string {
  if (locale === routing.defaultLocale) {
    return path === "" ? "/" : path;
  }
  return path === "" ? `/${locale}` : `/${locale}${path}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routing.locales.flatMap((locale) =>
    PUBLIC_ROUTES.map((route) => {
      const path = localizedPath(locale, route);
      const isHome = route === "";

      // Pattern: Sitemap alternates — declare per-locale variants for hreflang.
      const languages = Object.fromEntries(
        routing.locales.map((alt) => [alt, `${SITE_URL}${localizedPath(alt, route)}`]),
      );

      return {
        url: `${SITE_URL}${path}`,
        changeFrequency: isHome ? ("weekly" as const) : ("monthly" as const),
        priority: isHome ? 1 : 0.7,
        lastModified: now,
        alternates: { languages },
      };
    }),
  );
}
