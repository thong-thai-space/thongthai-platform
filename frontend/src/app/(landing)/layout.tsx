import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { PublicAiChatWidget } from '@/components/landing/ai-chat-widget';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <PublicAiChatWidget />
    </>
  );
}
