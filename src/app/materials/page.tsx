import { Metadata } from 'next';
import { V2Shell } from '@/components/V2Shell';
import { MaterialsCatalog } from '@/components/home/MaterialsCatalog';
import { FinalCTA } from '@/components/home/FinalCTA';

export const metadata: Metadata = {
  title: 'Materials Library | Precision Manufacturing Catalog',
  description:
    "Browse MechHub's available materials including various grades of Steel, Aluminum, and specialty alloys for your custom fabrication projects.",
  alternates: {
    canonical: '/materials',
  },
};

export default function MaterialsPage() {
  return (
    <V2Shell>
      <MaterialsCatalog headingAs="h1" />
      <FinalCTA />
    </V2Shell>
  );
}
