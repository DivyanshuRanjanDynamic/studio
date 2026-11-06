import { Metadata } from 'next';
import { V2Shell } from '@/components/V2Shell';
import { FinalCTA } from '@/components/home/FinalCTA';
import { HowItWorks } from '@/components/home/HowItWorks';
import { TaglineReveal } from '@/components/home/TaglineReveal';
import { AboutHero } from '@/components/about/AboutHero';
import { AboutPlatform } from '@/components/about/AboutPlatform';
import { AboutFounders } from '@/components/about/AboutFounders';

export const metadata: Metadata = {
  title: "About MechHub | Building India's Precision Infrastructure",
  description:
    'MechHub is a managed marketplace for custom manufacturing in India. Upload a CAD file, get an instant quote, and vetted partners make and deliver your parts.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <V2Shell>
      <AboutHero />
      <TaglineReveal
        lines={[
          'Getting one custom part made used to mean ten emails and ten different answers.',
          'MechHub turns it into one upload, one quote and one order.',
        ]}
      />
      <AboutPlatform />
      <HowItWorks />
      <AboutFounders />
      <FinalCTA />
    </V2Shell>
  );
}
