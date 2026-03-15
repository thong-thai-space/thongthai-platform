import type { Metadata } from 'next';
import { AboutPageContent } from '@/components/landing/about-page-content';

export const metadata: Metadata = {
  title: 'About | Thong Thai Space',
  description: 'Learn about Thong Thai Space - a dedicated team of technology experts on a mission to digitally transform businesses.',
};

export default function AboutPage() {
  return <AboutPageContent />;
}
