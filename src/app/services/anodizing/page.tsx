'use client';

import { ServicePageTemplate } from '@/components/services/ServicePageTemplate';
import { ANODIZING } from '@/lib/services/service-pages';

export default function AnodizingPage() {
  return <ServicePageTemplate config={ANODIZING} />;
}
