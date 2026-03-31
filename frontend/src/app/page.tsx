import {
  HeroSection,
  ServicesSection,
  PortfolioSection,
  ProcessSection,
  TestimonialsSection,
  CtaSection,
  TurnstileVerificationSection,
} from '@/components/landing';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { PublicAiChatWidget } from '@/components/landing/ai-chat-widget';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TurnstileVerificationSection />
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
