import { Metadata } from 'next';
import { LandingNav } from '@/components/LandingNav';
import { ServicesSection } from '@/components/ServicesSection';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Manufacturing Services | MechHub Precision Fabrication',
  description:
    'Explore MechHub\'s full range of manufacturing capabilities including CNC machining, laser cutting, bending, and specialized surface treatments.',
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <main className="pt-20">
        <ServicesSection />
      </main>
      <Footer />
    </div>
  );
}
