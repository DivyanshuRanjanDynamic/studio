import { Metadata } from 'next';
import { V2Shell } from '@/components/V2Shell';
import { ServicesSection } from '@/components/home/ServicesSection';
import { FinalCTA } from '@/components/home/FinalCTA';

export const metadata: Metadata = {
  title: 'Manufacturing Services | MechHub Precision Fabrication',
  description:
    "Explore MechHub's full range of manufacturing capabilities including CNC machining, laser cutting, bending, and specialized surface treatments.",
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesPage() {
  return (
    <V2Shell>
      <ServicesSection headingAs="h1" />
      <FinalCTA />
    </V2Shell>
  );
}
