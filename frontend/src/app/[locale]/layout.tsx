import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { AuthProvider } from "@/lib/auth";
import { QueryProvider } from "@/lib/query-provider";
import { SocketProvider } from "@/lib/socket";
import { AnimationProvider } from "@/components/motion/animation-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { routing } from "@/i18n/routing";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/seo/json-ld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://thongthaispace.com";

// Montserrat with Vietnamese subset so accented characters render correctly.
const montserrat = Montserrat({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });

  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/",
      languages: {
        vi: "/vi",
        en: "/en",
      },
    },
    openGraph: {
      url: "/",
      siteName: "Thong Thai Space",
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "meta" });
  const siteName = t("siteName");

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        {/* Pattern: SEO — Organization + WebSite schemas render once per page. */}
        <OrganizationJsonLd name={siteName} />
        <WebSiteJsonLd name={siteName} />
      </head>
      <body
        className={`${montserrat.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <NextIntlClientProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <SocketProvider>
                  <AnimationProvider>{children}</AnimationProvider>
                </SocketProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
