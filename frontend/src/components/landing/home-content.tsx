'use client';

import {
  ArchitectureAgentGate,
  HeroSection,
  ServicesSection,
  PortfolioSection,
  ProcessSection,
  SectionDivider,
  TestimonialsSection,
  CtaSection,
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
  const canRenderArchitectureAgent = true;

  return (
    <>
      <Navbar />
      <main className="pt-4 sm:pt-5 lg:pt-6">
        <HeroSection
          architectureOverlay={
            <ArchitectureAgentGate canRenderAgent={canRenderArchitectureAgent} />
          }
        />
        <SectionDivider tone="primary" />
        <ServicesSection />
        <SectionDivider tone="accent" />
        <PortfolioSection />
        <SectionDivider tone="primary" />
        <ProcessSection />
        <SectionDivider tone="accent" />
        <TestimonialsSection />
        <SectionDivider tone="primary" />
        <CtaSection />
      </main>
      <Footer />
      <PublicAiChatWidget />
    </>
  );
}
