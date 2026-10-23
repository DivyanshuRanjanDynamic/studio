import { Metadata } from 'next';
import { ServicesPageClient } from './ServicesPageClient';

export const metadata: Metadata = {
  title: 'Manufacturing Services | MechHub Precision Fabrication',
  description:
    "Explore MechHub's full range of manufacturing capabilities including CNC machining, laser cutting, bending, and specialized surface treatments.",
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesPage() {
  return <ServicesPageClient />;
}
