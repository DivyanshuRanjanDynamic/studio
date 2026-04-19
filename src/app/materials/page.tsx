import { Metadata } from 'next';
import { LandingNav } from '@/components/LandingNav';
import { MaterialsSection } from '@/components/MaterialsSection';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Materials Library | Precision Manufacturing Catalog',
  description: 'Browse MechHub\'s available materials including various grades of Steel, Aluminum, and specialty alloys for your custom fabrication projects.',
  alternates: {
    canonical: '/materials',
  },
};

export default function MaterialsPage() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <MaterialsSection />
      <Footer />
    </div>
  );
}
