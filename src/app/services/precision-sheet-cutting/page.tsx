'use client';

import { ServicePageTemplate } from '@/components/services/ServicePageTemplate';
import { PRECISION_SHEET_CUTTING } from '@/lib/services/service-pages';

export default function PrecisionSheetCuttingPage() {
  return <ServicePageTemplate config={PRECISION_SHEET_CUTTING} />;
}
