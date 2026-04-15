"use client";

import { useMemo, useState } from "react";
import {
  ArchitectureAgentGate,
  HeroSection,
  ServicesSection,
  PortfolioSection,
  ProcessSection,
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
        <HeroSection onIntroVideoCompleted={() => setIntroVideoDone(true)} />
        <ArchitectureAgentGate canRenderAgent={canRenderArchitectureAgent} />
        <ServicesSection />
        <PortfolioSection />
        <ProcessSection />
        <TestimonialsSection />
        <CtaSection />
      </main>
      <Footer />
      <PublicAiChatWidget />
    </>
  );
}
