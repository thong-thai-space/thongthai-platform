import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://thongthaispace.com";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:4000/api/v1";

// Public routes (relative to locale prefix).
const PUBLIC_ROUTES = [
  "",
  "/about",
  "/services",
  "/portfolio",
  "/blog",
  "/contact",
  "/privacy-policy",
  "/terms-and-conditions",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

interface BlogSitemapEntry {
  locale: string;
  slug: string;
  updatedAt: string;
}

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

async function fetchBlogSlugs(): Promise<BlogSitemapEntry[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/blog/sitemap`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as BlogSitemapEntry[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const blogSlugs = await fetchBlogSlugs();

  const staticRoutes = routing.locales.flatMap((locale) =>
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

  // Dynamic blog post routes — one entry per published post per locale.
  const blogRoutes: MetadataRoute.Sitemap = blogSlugs.map(({ locale, slug, updatedAt }) => {
    const l = locale.toLowerCase();
    const route = `/blog/${slug}`;
    const path = localizedPath(l, route);
    const languages = Object.fromEntries(
      routing.locales.map((alt) => [alt, `${SITE_URL}${localizedPath(alt, route)}`]),
    );
    return {
      url: `${SITE_URL}${path}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified: new Date(updatedAt),
      alternates: { languages },
    };
  });

  return [...staticRoutes, ...blogRoutes];
}
