'use client';

import { V2Shell } from '@/components/V2Shell';
import { MaterialsCatalog } from '@/components/home/MaterialsCatalog';

export function MaterialsPageClient() {
  return (
    <V2Shell>
      <MaterialsCatalog headingAs="h1" />
    </V2Shell>
  );
}
