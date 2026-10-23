'use client';

import { ServicePageTemplate } from '@/components/services/ServicePageTemplate';
import { POWDER_COATING } from '@/lib/services/service-pages';

export default function PowderCoatingPage() {
  return <ServicePageTemplate config={POWDER_COATING} />;
}
