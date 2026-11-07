/*
 * MECHHUB HOMEPAGE — OUTSTANDING TODOs
 * ─────────────────────────────────────
 * [ ] Watch demo (WatchDemo.tsx): S3 video URL uses a signed URL — replace with a permanent embed
 * [ ] Proof: fill in real stats and customer quotes in components/home/proof.ts
 *     (the section stays hidden until they exist)
 */
import type { Metadata } from 'next';
import '@/components/home/landing.css';
import { landingFontVars } from '@/components/home/fonts';
import { cn } from '@/utils';

import { HomeNav } from '@/components/home/HomeNav';
import { IntroSplash } from '@/components/brand/IntroSplash';
import { Hero } from '@/components/home/Hero';
import { WhyMechHub } from '@/components/home/WhyMechHub';
import { PromiseSection } from '@/components/home/PromiseSection';
import { HowItWorks } from '@/components/home/HowItWorks';
import { AboutIndex } from '@/components/home/AboutIndex';
import { PartsCatalogue } from '@/components/home/PartsCatalogue';
import { TaglineReveal } from '@/components/home/TaglineReveal';
import { ServicesSection } from '@/components/home/ServicesSection';
import { MaterialsCatalog } from '@/components/home/MaterialsCatalog';
import { Testimonials } from '@/components/home/Testimonials';
import { MechMasterSection } from '@/components/home/MechMasterSection';
import { FAQSection } from '@/components/home/FAQSection';
import { FinalCTA, HomeFooter } from '@/components/home/FinalCTA';
import { FAQ } from '@/components/home/faq';

// Copy mirrors claims the page itself makes (hero, FAQ, 72 hour average turnaround).
const HOME_TITLE = 'Custom CNC, laser cut and sheet metal parts in India | MechHub';
const HOME_DESCRIPTION =
  'Upload a STEP  get an instant quote, and receive vetted, NDA protected parts anywhere in India in 72 hours on average.';

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

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function Home() {
  return (
    <div className={cn('lp-root lp-glow min-h-screen', landingFontVars)} suppressHydrationWarning>
      <IntroSplash />
      <HomeNav />
      <main id="main">
        <Hero />
        <AboutIndex />
        <PartsCatalogue />
        <WhyMechHub />
        <HowItWorks />
        <TaglineReveal />
        <PromiseSection />
        <ServicesSection />
        <MaterialsCatalog preview />
        <Testimonials />
        <MechMasterSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <HomeFooter />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
    </div>
  );
}
