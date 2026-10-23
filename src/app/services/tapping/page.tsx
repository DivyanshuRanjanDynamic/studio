'use client';

import { ServicePageTemplate } from '@/components/services/ServicePageTemplate';
import { TAPPING } from '@/lib/services/service-pages';

export default function TappingPage() {
  return <ServicePageTemplate config={TAPPING} />;
}
