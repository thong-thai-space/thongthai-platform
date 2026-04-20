import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://thongthaispace.com";

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

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
    lastModified: new Date(),
  }));
}
