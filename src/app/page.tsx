/*
 * MECHHUB HOMEPAGE — OUTSTANDING TODOs
 * ─────────────────────────────────────
 * [ ] Showreel:   S3 video URL uses a signed URL — replace with a permanent embed
 * [ ] Testimonials: Replace placeholder quotes with real customer quotes
 */
import type { Metadata } from 'next';
import '@/components/home/landing.css';
import { landingFontVars } from '@/components/home/fonts';
import { cn } from '@/utils';

import { HomeNav } from '@/components/home/HomeNav';
import { Hero } from '@/components/home/Hero';
import { Showreel } from '@/components/home/Showreel';
import { Marquee } from '@/components/home/primitives';
import { SegmentSection } from '@/components/home/SegmentSection';
import { ServicesSection } from '@/components/home/ServicesSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { MaterialsCatalog } from '@/components/home/MaterialsCatalog';
import { PromiseSection } from '@/components/home/PromiseSection';
import { WhyMechHub } from '@/components/home/WhyMechHub';
import { Testimonials, WordsBanner } from '@/components/home/Testimonials';
import { MechMasterSection } from '@/components/home/MechMasterSection';
import { FinalCTA, HomeFooter } from '@/components/home/FinalCTA';

const TRUST_POINTS = [
  'Verified Vendors',
  'Fast Turnaround',
  'Secure Payments',
  'Pan India Delivery',
  'Sustainable Manufacturing',
];

// Copy mirrors claims the page itself makes (hero, trust marquee, 72hr stat).
const HOME_TITLE = 'Custom Manufacturing, Made Fast & Affordable | MechHub';
const HOME_DESCRIPTION =
  'Upload your design and get CNC machined, laser cut and bent parts delivered across India. Instant quotes, verified vendors, 72-hour typical turnaround.';

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: '/',
    siteName: 'MechHub',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function Home() {
  return (
    <div className={cn('lp-root min-h-screen', landingFontVars)} suppressHydrationWarning>
      <HomeNav />
      <main>
        <Hero />
        <Showreel />
        <div className="mt-16">
          <Marquee items={TRUST_POINTS} />
        </div>
        <SegmentSection />
        <ServicesSection />
        <Marquee items={TRUST_POINTS} dark />
        <HowItWorks />
        <MaterialsCatalog />
        <PromiseSection />
        <WhyMechHub />
        <WordsBanner />
        <Testimonials />
        <MechMasterSection />
        <FinalCTA />
      </main>
      <HomeFooter />
    </div>
  );
}
