'use client';

import {
  HeroSection,
  ServicesSection,
  PortfolioSection,
  BlogSection,
  SectionDivider,
} from '@/components/landing';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { PublicAiChatWidget } from '@/components/landing/ai-chat-widget';

/**
 * Pattern: Client Island — the landing home is a heavily animated 3D experience
 * that cannot be a Server Component. The route page (`page.tsx`) stays a thin
 * RSC wrapper so `generateMetadata` and per-locale crawling still work.
 */
export function HomeContent() {
  return (
    <>
      <Navbar />
      <main className="pt-4 sm:pt-5 lg:pt-6">
        <HeroSection />
        <SectionDivider tone="primary" />
        <ServicesSection />
        <SectionDivider tone="accent" />
        <PortfolioSection />
        <SectionDivider tone="primary" />
        <BlogSection />
      </main>
      <Footer />
      <PublicAiChatWidget />
    </>
  );
}
