'use client';

import { useState, useEffect, useMemo } from 'react';
import { LandingNav } from '@/components/LandingNav';
import { RotatingGears } from '@/components/Gears';
import { ServicesSection } from '@/components/ServicesSection';
import { MaterialsSection } from '@/components/MaterialsSection';
import { Footer } from '@/components/Footer';
import { LaserArrow } from '@/components/LaserArrow';
import { Button } from '@/components/ui/button';
import {
  Settings,
  Zap,
  ArrowRight,
  Upload,
  CheckCircle2,
  ShieldCheck,
  CircleDollarSign,
  ClipboardCheck,
  MessageSquare,
  Rocket,
  HardHat,
  Palette,
  Users,
  Package,
} from 'lucide-react';
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

              <div className="relative mb-6 md:mb-8 min-h-[auto] w-full transition-opacity duration-700 ease-in-out">
                <h1 className="font-poppins tracking-tight uppercase leading-[0.95] drop-shadow-md">
                  <div className="text-3xl md:text-4xl lg:text-5xl text-white font-black mb-4">
                    {heroPhrases[currentPhraseIndex % heroPhrases.length]?.split('\n')[0]}
                  </div>
                  {heroPhrases[currentPhraseIndex % heroPhrases.length]?.split('\n')[1] && (
                    <div className="text-lg md:text-xl lg:text-2xl text-cyan-200 tracking-wider mt-2 opacity-90 font-black">
                      {heroPhrases[currentPhraseIndex % heroPhrases.length]?.split('\n')[1]}
                    </div>
                  )}
                </h1>
              </div>

              <p className="text-base md:text-lg text-white/80 max-w-xl leading-relaxed mb-10 font-medium">
                <span className="text-cyan-300 font-bold">Upload a design</span> and get precision
                engineered parts delivered with transparency. Built for students, startups, and
                hobbyists.
              </p>

              <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12 md:mb-20 w-full lg:justify-start">
                <Link
                  href="/login?tab=register&redirect=/dashboard"
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
              </div>
            </div>
            <div className="lg:col-span-1" /> {/* Spacer */}
            <div
              className="hidden lg:flex lg:col-span-6 relative items-center justify-center animate-in fade-in slide-in-from-right-12 duration-1000 fill-mode-both"
              style={{ animationDelay: '400ms' }}
            >
              <div className="relative w-full  max-w-[1000px] h-[500px] group">
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

      <div className="flex flex-col items-center mt-24 mb-16 relative">
        <div className="absolute inset-0 bg-[#0d7cbc]/5 blur-3xl rounded-full scale-150 animate-pulse" />
        <span className="text-xs md:text-sm uppercase tracking-[0.6em] text-[#0d7cbcff] font-black mb-6 animate-pulse transition-all hover:tracking-[0.8em] cursor-default relative z-10">
          Explore Operations
        </span>
        <div className="relative z-10 animate-bounce">
          <LaserArrow
            size={32}
            color="#0d7cbcff"
            className="drop-shadow-[0_0_15px_rgba(13,124,188,0.5)]"
          />
        </div>
      </div>

      <ServicesSection />
      <MaterialsSection />

      <section id="how-it-works" className="py-24 relative overflow-hidden bg-white">
        <div className="absolute inset-0 blueprint-grid opacity-[0.03]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#2F5FA7] mb-4">
              THE PROCESS
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-6">
              How It Works
            </h2>
            <p className="text-[#64748B] max-w-xl mx-auto text-sm md:text-base font-medium px-4 text-balance">
              From design file to finished part. A streamlined process built for speed, quality, and
              full transparency.
            </p>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 md:px-0">
            <div className="hidden lg:block absolute top-[34px] left-[10%] right-[10%] z-0 h-0.5 bg-slate-100" />
            <div className="lg:hidden absolute left-[31px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-blue-600/50 via-slate-200 to-transparent z-0" />
            <div className="flex flex-col lg:grid lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
              {[
                {
                  num: '01',
                  icon: Settings,
                  title: 'Choose options',
                  desc: 'Select manufacturing process, material additional manufacturing option.',
                },
                {
                  num: '02',
                  icon: Upload,
                  title: 'Upload your design',
                  desc: 'Upload your STEP files through our secure portal.',
                },
                {
                  num: '03',
                  icon: Zap,
                  title: 'Get quotation',
                  desc: 'Receive an instant or rapid quote based on your specifications.',
                },
                {
                  num: '04',
                  icon: Package,
                  title: 'Receive your parts',
                  desc: 'We manufacture and deliver your parts directly to your door.',
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className="flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center group relative animate-in fade-in slide-in-from-left duration-700 fill-mode-both"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="relative mb-0 lg:mb-8 z-10 shrink-0 mr-6 lg:mr-0">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-lg group-hover:border-[#2F5FA7]/30 group-hover:shadow-[#2F5FA7]/10 transition-all duration-300">
                      <step.icon className="w-6 h-6 md:w-7 md:h-7 text-[#2F5FA7]" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 md:w-7 md:h-7 rounded-full bg-[#1E3A66] flex items-center justify-center shadow-md">
                      <span className="text-[9px] md:text-[10px] font-bold text-white font-mono">
                        {step.num}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 pt-2 lg:pt-0">
                    <h3 className="text-sm md:text-base font-bold text-[#0F172A] mb-1 md:mb-3 group-hover:text-[#2F5FA7] transition-colors uppercase tracking-tight">
                      {step.title}
                    </h3>
                    <p className="text-[#64748B] text-[11px] md:text-xs leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-20 flex flex-col md:flex-row items-center justify-center gap-6 p-6 md:p-8 rounded-3xl border border-blue-50 bg-[#E8F1FF]/50 max-w-3xl mx-auto shadow-sm">
            <div className="flex-1 text-center md:text-left">
              <p className="text-[#1E3A66] font-bold text-lg mb-1">Ready to get your parts made?</p>
              <p className="text-[#64748B] text-sm font-medium">
                Upload your design and get a quote in minutes.
              </p>
            </div>
            <Link
              href="/login?tab=register&redirect=/dashboard"
              className="w-full md:w-auto shrink-0"
            >
              <Button className="w-full md:w-auto h-12 px-8 text-sm font-bold bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-full shadow-lg transition-all">
                Upload Your Design <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-12 text-center opacity-70">
            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#2F5FA7]" />
              Enterprise-grade Data Protection , All designs protected by NDA & AES-256 encryption.
            </p>
          </div>
        </div>
      </section>

      {/* Built For Section - Premium Upgrade */}
      <section className="py-20 bg-white relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/40 via-transparent to-transparent opacity-70" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.5em] text-slate-500 mb-3">
              Designed For
            </h2>
            <div className="h-0.5 w-10 bg-blue-600/30 mx-auto rounded-full" />
          </div>

          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { icon: Rocket, label: 'Startups', desc: 'Rapid prototyping' },
              { icon: HardHat, label: 'Manufacturers', desc: 'Full-scale production' },
              { icon: Palette, label: 'Designers', desc: 'Custom creations' },
              { icon: Users, label: 'Student Teams', desc: 'Innovation projects' },
            ].map((item, i) => (
              <div
                key={item.label}
                className="group flex flex-col items-center p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] bg-white border border-slate-100/80 hover:border-blue-100 hover:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06)] transition-all duration-500 cursor-default animate-in fade-in slide-in-from-bottom-8 fill-mode-both"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-slate-50 flex items-center justify-center mb-6 transition-all duration-500 group-hover:bg-blue-50 group-hover:scale-105 shadow-sm">
                  <item.icon className="w-6 h-6 md:w-8 md:h-8 text-[#2F5FA7] transition-all duration-500" />
                </div>
                <div className="text-center">
                  <h3 className="block text-sm md:text-xl font-bold text-slate-900 mb-2">
                    {item.label}
                  </h3>
                  <p className="block text-[9px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Support Section */}
      <section className="py-20 lg:py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto rounded-[32px] md:rounded-[40px] border border-blue-50 bg-[#E8F1FF]/30 p-6 md:p-16 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2F5FA7]/5 rounded-full blur-3xl -z-10" />
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="order-1 lg:order-1 text-center lg:text-left">
                <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.4em] text-[#2F5FA7] mb-6">
                  EXPERT SUPPORT
                </p>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-6 lg:mb-8 leading-tight lg:leading-[1.15]">
                  Need Expert <br className="hidden md:block" /> Manufacturing Guidance?
                </h2>
                <p className="text-[#64748B] text-sm md:text-lg leading-relaxed mb-8 md:mb-10 font-medium max-w-lg mx-auto lg:mx-0">
                  Get your design reviewed, value-engineered, or fully optimised by our in-house
                  experts, before a single chip is cut.
                </p>

                <div className="lg:hidden w-full mb-10 order-2">
                  <div className="relative h-64 rounded-2xl overflow-hidden shadow-xl border-2 border-white">
                    <Image
                      src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800"
                      alt="Engineering Consultation"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/40 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2F5FA7] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#1E3A66] uppercase tracking-wide">
                        Expert Available
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-6 mb-10 md:mb-12 order-3 lg:order-2">
                  {[
                    { icon: Settings, label: 'Design Optimization' },
                    { icon: CircleDollarSign, label: 'Cost Reduction' },
                    { icon: ClipboardCheck, label: 'DFM Analysis' },
                    { icon: MessageSquare, label: 'Full Design Support' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-default"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 md:w-5 md:h-5 text-[#2F5FA7]" />
                      </div>
                      <p className="text-[10px] md:text-sm font-bold text-[#1E3A66] text-center md:text-left">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="order-4 lg:order-3">
                  <Button
                    size="lg"
                    onClick={() =>
                      router.push('/login?redirect=/consultation')
                    }
                    className="w-full md:w-auto h-14 md:h-16 px-8 md:px-12 text-sm md:text-base font-bold bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-full shadow-xl transition-all"
                  >
                    Book a Free Consultation <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-3 md:mt-4 font-medium">
                    No commitment. 30-min free session with our lead engineers.
                  </p>
                </div>
              </div>

              <div className="hidden lg:block relative h-[500px] rounded-3xl overflow-hidden shadow-2xl border-4 border-white lg:order-2">
                <Image
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800"
                  alt="Engineering Consultation"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 flex items-center gap-3 bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-xl">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2F5FA7] animate-pulse" />
                  <span className="text-xs font-bold text-[#1E3A66] uppercase tracking-wide">
                    Expert Sessions Available
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
