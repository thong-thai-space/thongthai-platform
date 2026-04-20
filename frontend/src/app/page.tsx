"use client";

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

export default function Home() {
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
