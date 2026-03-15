import type { Metadata } from 'next';
import { ServicesPageContent } from '@/components/landing/services-page-content';

export const metadata: Metadata = {
  title: 'Services | Thong Thai Space',
  description: 'Professional Web, App, AI development and IT consulting services from Thong Thai Space.',
};

export default function ServicesPage() {
  return <ServicesPageContent />;
}
