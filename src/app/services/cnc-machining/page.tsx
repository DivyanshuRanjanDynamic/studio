'use client';

import { ServicePageTemplate } from '@/components/services/ServicePageTemplate';
import { CNC_MACHINING } from '@/lib/services/service-pages';

export default function CncMachiningPage() {
  return <ServicePageTemplate config={CNC_MACHINING} />;
}
