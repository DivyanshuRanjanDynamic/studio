/*
 * MECHHUB HOMEPAGE — OUTSTANDING TODOs
 * ─────────────────────────────────────
 * [ ] TractionBar: Replace stat numbers with real MechHub metrics
 * [ ] HowItWorks:  S3 video URL uses a signed URL — replace with a permanent embed
 * [ ] Testimonials: Replace placeholder quotes with real customer quotes
 * [ ] Testimonials: Replace placeholder logos with real university/company logos
 * [ ] Testimonials: Update "500+ builders" count with real number
 * [ ] MechMasterSection: Replace mock partner card with real MechMaster profiles
 * [ ] FinalCTA: Confirm /login redirect URL is correct
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { LandingNav } from '@/components/LandingNav';
import { MaterialsSection } from '@/components/MaterialsSection';
import { TransparencySection } from '@/components/TransparencySection';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';
import { Footer } from '@/components/Footer';

// MECHHUB: traction bar
import { TractionBar } from '@/components/home/TractionBar';
// MECHHUB: audience segmentation
import { SegmentSection } from '@/components/home/SegmentSection';
// MECHHUB: services grid
import { ServicesSection } from '@/components/home/ServicesSection';
// MECHHUB: how it works + video
import { HowItWorks } from '@/components/home/HowItWorks';
// MECHHUB: differentiation / why mechhub
import { WhyMechHub } from '@/components/home/WhyMechHub';
// MECHHUB: testimonials
import { Testimonials } from '@/components/home/Testimonials';
// MECHHUB: mechmaster ecosystem
import { MechMasterSection } from '@/components/home/MechMasterSection';
// MECHHUB: final conversion CTA
import { FinalCTA } from '@/components/home/FinalCTA';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { isVendorRole } from '@/lib/roles';

export default function Home() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const { toast } = useToast();
  const db = useFirestore();
  const router = useRouter();
  const user = useUser();

  // Rotating Hero Text State
  const heroPhrases = ['Custom Manufacturing \n Made Fast & Affordable'];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [showFAB, setShowFAB] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // trigger fade out
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % heroPhrases.length);
        setFade(true); // trigger fade in
      }, 500); // half second fade
    }, 4500); // rotate every 4.5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());

    const handleScroll = () => {
      setShowFAB(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch a subset of active vendors for the landing page showcase
  const landingVendorsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('isActive', '==', true), limit(12));
  }, [db]);
  const { data: landingVendors } = useCollection(landingVendorsQuery);
  const filteredLandingVendors = useMemo(
    () => (landingVendors || []).filter((vendor) => isVendorRole(vendor.role)).slice(0, 6),
    [landingVendors]
  );

  const handleWIPClick = (e: React.MouseEvent, feature: string) => {
    e.preventDefault();
    toast({
      title: 'Coming Soon!',
      description: `We're currently working on the ${feature}. Check back soon for updates!`,
    });
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden bg-white" suppressHydrationWarning>
      <LandingNav />

      <section className="relative pt-24 pb-16 overflow-hidden bg-[#2F5FA7]">
        {/* Advanced Background Elements */}
        <div className="blueprint-grid opacity-[0.1]" suppressHydrationWarning />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E3A66] via-[#2F5FA7] to-[#1E3A66] opacity-90" />

        {/* Cinematic glow effects */}
        <div
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full bg-blue-300/10 blur-[150px] pointer-events-none"
          aria-hidden="true"
        />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#1E3A66] to-transparent pointer-events-none z-10" />

        <div className="container mx-auto px-4 md:px-10 lg:px-30 relative z-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-28 items-center">
            <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left">
              <ScrollReveal variant="fade-down" delay={100}>
                <div className="inline-flex items-center gap-2.5 px-4 md:px-5 py-1.5 md:py-2 rounded-full border border-white/20 bg-white/10 text-white text-[10px] md:text-xs font-semibold tracking-[0.15em] md:tracking-widest uppercase mb-6 md:mb-10 shadow-2xl backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  Built in India for Builders{' '}
                  <img
                    src="https://flagcdn.com/in.svg"
                    alt="India Flag"
                    className="w-6 h-4 object-cover shadow-sm"
                  />
                </div>
              </ScrollReveal>

              <div className="relative mb-6 md:mb-8 min-h-[auto] w-full transition-opacity duration-700 ease-in-out">
                <h1 className="font-poppins tracking-tight uppercase leading-[0.95] drop-shadow-md">
                  <div className="text-3xl md:text-4xl lg:text-5xl text-white font-black mb-4">
                    <TextReveal text={heroPhrases[currentPhraseIndex % heroPhrases.length]?.split('\n')[0] || ''} />
                  </div>
                  {heroPhrases[currentPhraseIndex % heroPhrases.length]?.split('\n')[1] && (
                    <ScrollReveal variant="fade-left" delay={300} as="div" className="text-lg md:text-xl lg:text-2xl text-cyan-200 tracking-wider mt-2 opacity-90 font-black">
                      {heroPhrases[currentPhraseIndex % heroPhrases.length]?.split('\n')[1]}
                    </ScrollReveal>
                  )}
                </h1>
              </div>

              <ScrollReveal variant="fade-up" delay={200}>
                <p className="text-base md:text-lg text-white/80 max-w-xl leading-relaxed mb-10 font-medium">
                  <span className="text-cyan-300 font-bold">Upload a design</span> and get precision
                  engineered parts delivered with transparency. Built for students, startups, and
                  hobbyists.
                </p>
              </ScrollReveal>

              <ScrollReveal variant="fade-up" delay={300}>
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12 md:mb-20 w-full lg:justify-start">
                  <Link
                    href="/upload"
                    className="w-full md:w-auto"
                  >
                    <Button
                      size="lg"
                      className="w-full md:w-auto h-16 md:h-16 px-10 md:px-12 text-base md:text-lg font-bold bg-white hover:bg-white/90 text-[#2F5FA7] rounded-xl md:rounded-full shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                      Upload Your Design
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                    </Button>
                  </Link>
                  <Link
                    href="/onboard"
                    className="w-full md:w-auto"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full md:w-auto h-16 md:h-16 px-10 md:px-12 text-base md:text-lg font-bold bg-white hover:bg-white/90 text-[#2F5FA7] rounded-xl md:rounded-full shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                      Become a MechMaster
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </ScrollReveal>
            </div>
            <div className="lg:col-span-1" /> {/* Spacer */}
            <div className="hidden lg:flex lg:col-span-6 relative items-center justify-center">
              <ScrollReveal variant="scale-in" delay={400} className="w-full">
                <div className="relative w-full max-w-[1000px] h-[500px] group">
                  {/* Cinematic Card with Large Rounding */}
                  <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.6)] transition-all duration-700 group-hover:shadow-[0_60px_120px_rgba(0,0,0,0.7)]">
                    <Image
                      src="/home_page12.jpg"
                      alt="MechHub Smart Manufacturing Facility"
                      fill
                      priority
                      className="object-cover transition-transform duration-1000"
                    />

                    {/* Overlay Gradients for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                    {/* Bottom Content Area */}
                    <div className="absolute bottom-12 left-10 right-10 space-y-8">
                      <div className="space-y-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 delay-100">
                        <h2 className="text-white text-4xl font-black tracking-tight leading-[0.9] drop-shadow-2xl bottom-20">
                          AUTOMATED
                          <br />
                          MANUFACTURING
                        </h2>
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.4em] ml-1">
                          Precision Engineered Parts Delivered with Transparency
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ambient Glows */}
                  <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-500/20 blur-[80px] rounded-full pointer-events-none -z-10" />
                  <div className="absolute -top-10 -left-10 w-48 h-48 bg-cyan-400/10 blur-[80px] rounded-full pointer-events-none -z-10" />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>

        <div className="marquee-container mt-auto relative z-20">
          <div className="flex animate-marquee gap-3 md:gap-6 items-center py-4 md:py-6">
            {[
              1, 2, 3, 4, 5, 2, 3, 4, 5, 1, 2, 3, 4, 5, 4, 2, 1, 2, 3, 4, 5, 2, 3, 4, 5, 1, 2, 3, 4,
              5, 4, 2,
            ].map((i, idx) => (
              <div
                key={`part-1-${idx}`}
                className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl md:rounded-[24px] border border-white/10 flex items-center justify-center group duration-500 relative overflow-hidden bg-white shadow-lg"
              >
                <Image
                  src={`/part_${i}.png`}
                  alt={`Industrial Component ${idx}`}
                  width={50}
                  height={50}
                  className="object-contain opacity-100 group-hover:scale-110 transition-all duration-700 md:w-[70px] md:h-[70px]"
                />
              </div>
            ))}
          </div>
        </div>
        <style jsx>{`
          .marquee-container {
            display: flex;
            width: fit-content;
          }
          .animate-marquee {
            animation: marquee 40s linear infinite;
          }
          @keyframes marquee {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-marquee:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* MECHHUB: Section A — Traction Bar */}
      <TractionBar />

      {/* MECHHUB: Section B — Who Is This For */}
      <SegmentSection />

      {/* MECHHUB: Section C — Services Grid */}
      <ServicesSection />

      {/* MECHHUB: Section D — How It Works */}
      <HowItWorks />

      {/* Existing: Materials section */}
      <MaterialsSection />

      {/* Existing: Transparency section */}
      <TransparencySection />

      {/* MECHHUB: Section E — Why MechHub */}
      <WhyMechHub />

      {/* MECHHUB: Section F — Testimonials */}
      <Testimonials />

      {/* MECHHUB: Section G — MechMaster Ecosystem */}
      <MechMasterSection />

      {/* MECHHUB: Section H — Final CTA */}
      <FinalCTA />

      <Footer />
    </div>
  );
}
