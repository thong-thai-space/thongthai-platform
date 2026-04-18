"use client";

import { useMemo, useState } from "react";
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
import { useSearchParams } from "next/navigation";

export default function Home() {
  const [introVideoDone, setIntroVideoDone] = useState(false);
  const searchParams = useSearchParams();

  const forceOpenArchitecture = useMemo(
    () => searchParams.get("openArchitectureAgent") === "1",
    [searchParams],
  );

  const canRenderArchitectureAgent = introVideoDone || forceOpenArchitecture;

  return (
    <>
      <Navbar />
      <main>
        <HeroSection
          onIntroVideoCompleted={() => setIntroVideoDone(true)}
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
