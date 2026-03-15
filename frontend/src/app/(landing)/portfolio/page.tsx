import type { Metadata } from 'next';
import { PortfolioPageContent } from '@/components/landing/portfolio-page-content';

export const metadata: Metadata = {
  title: 'Portfolio | Thong Thai Space',
  description: 'Featured projects completed by Thong Thai Space.',
};

export default function PortfolioPage() {
  return <PortfolioPageContent />;
}
