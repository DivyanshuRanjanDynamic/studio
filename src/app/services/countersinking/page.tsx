'use client';

import { ServicePageTemplate } from '@/components/services/ServicePageTemplate';
import { COUNTERSINKING } from '@/lib/services/service-pages';

export default function CountersinkingPage() {
  return <ServicePageTemplate config={COUNTERSINKING} />;
}
