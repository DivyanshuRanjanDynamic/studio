import { Metadata } from 'next';
import { V2Shell } from '@/components/V2Shell';
import { FinalCTA } from '@/components/home/FinalCTA';
import { Marquee } from '@/components/home/primitives';
import { AboutHero } from '@/components/about/AboutHero';
import { AboutMission } from '@/components/about/AboutMission';
import { AboutPlatform } from '@/components/about/AboutPlatform';
import { AboutJourney } from '@/components/about/AboutJourney';
import { AboutServices } from '@/components/about/AboutServices';
import { AboutFounders } from '@/components/about/AboutFounders';
import '@/components/about/about.css';

const TICKER = ['Sheet Cutting', 'CNC Machining', 'Bending', 'Hardware Insertion', 'Anodizing', 'Powder Coating'];

export const metadata: Metadata = {
  title: "About MechHub | Building India's Precision Infrastructure",
  description:
    'MechHub is an institutional-grade marketplace connecting design teams with verified CNC, laser, and fabrication experts across India.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <V2Shell>
      <AboutHero />
      <Marquee items={TICKER} dark />
      <AboutMission />
      <AboutPlatform />
      <AboutJourney />
      <AboutFounders />
      <FinalCTA />
    </V2Shell>
  );
}
