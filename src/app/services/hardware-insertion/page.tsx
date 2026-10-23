'use client';

import { ServicePageTemplate } from '@/components/services/ServicePageTemplate';
import { HARDWARE_INSERTION } from '@/lib/services/service-pages';

export default function HardwareInsertionPage() {
  return <ServicePageTemplate config={HARDWARE_INSERTION} />;
}
