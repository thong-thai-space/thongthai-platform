import {
  HeroSection,
  ServicesSection,
  PortfolioSection,
  ProcessSection,
  TestimonialsSection,
  CtaSection,
  TurnstileVerificationContainer,
} from '@/components/landing';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { PublicAiChatWidget } from '@/components/landing/ai-chat-widget';

export default function Home() {
  const turnstileSiteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '';

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <TurnstileVerificationContainer siteKey={turnstileSiteKey} />
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
