import { Metadata } from 'next';
import { MaterialsPageClient } from './MaterialsPageClient';

export const metadata: Metadata = {
  title: 'Materials Library | Precision Manufacturing Catalog',
  description:
    "Browse MechHub's available materials including various grades of Steel, Aluminum, and specialty alloys for your custom fabrication projects.",
  alternates: {
    canonical: '/materials',
  },
};

export default function MaterialsPage() {
  return <MaterialsPageClient />;
}
