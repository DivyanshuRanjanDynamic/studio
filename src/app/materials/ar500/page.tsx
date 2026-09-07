'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Maximize2,
  Search,
  ArrowRight,
  Target,
  Wrench,
  ShieldCheck,
  Plus,
  Minus,
  Check,
} from 'lucide-react';

// --- DATA ---

const AR500_DATA = {
  name: 'AR500 Steel Sheet Metal',
  thicknessRange: '.80" - .120"',
  thicknessCount: '5 Thicknesses',
  productionTime: '2-4 days',
  heroImg: '/ar500_hero_part_black.png',
  bgImg: '/ar400_hero_bg.png',
};

const SECONDARY_NAV = [
  { label: 'QUICK LOOK', id: 'quick-look' },
  { label: 'SPECIFICATIONS', id: 'specifications' },
  { label: 'ABOUT', id: 'about' },
  { label: 'RESOURCES', id: 'resources' },
];

export default function Ar500Page() {
  const [activeTab, setActiveTab] = useState('QUICK LOOK');
  const [unit, setUnit] = useState<'inch' | 'mm'>('mm');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [selectedThicknessIndex, setSelectedThicknessIndex] = useState(4); // Default to .500"

  const thicknesses = [
    { inch: '.119"', mm: '3.02mm', barWidth: 'w-8' },
    { inch: '.187"', mm: '4.75mm', barWidth: 'w-10' },
    { inch: '.250"', mm: '6.35mm', barWidth: 'w-12' },
    { inch: '.375"', mm: '9.53mm', barWidth: 'w-14' },
    { inch: '.500"', mm: '12.7mm', barWidth: 'w-16' },
  ];

  const currentThickness = thicknesses[selectedThicknessIndex];

  const convertValue = (val: string) => {
    if (unit === 'mm') return val;
    const match = thicknesses.find((t) => t.mm === val);
    return match ? match.inch : val;
  };

  return (
    <main className="min-h-screen bg-white">
      <LandingNav />

      {/* 2. Cinematic Hero Section - Blue & White Theme */}
      <section className="relative min-h-[600px] bg-blue-600 flex items-center overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <Image
            src={AR500_DATA.bgImg}
            alt="Steel Texture"
            fill
            className="object-cover opacity-5 mix-blend-overlay grayscale brightness-150"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1E3A8A] via-[#2F5FA7]/80 to-transparent" />
          <div className="blueprint-grid opacity-[0.05]" />
        </div>

        <div className="container mx-auto px-6 relative z-10 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12">
            {/* Left Content */}
            <div className="lg:col-span-6">
              <div className="flex items-center gap-2.5 mb-8">
                <span className="w-8 h-[1.5px] bg-blue-300" />
                <span className="text-[10px] font-black text-blue-100 uppercase tracking-[0.4em]">
                  Extreme Abrasion Resistance
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-white leading-[0.95] mb-10 uppercase tracking-tighter drop-shadow-sm">
                AR500
                <br />
                <span className="text-white">STEEL</span>
                <br />
                <span className="text-blue-100">SHEET METAL</span>
              </h1>

              <div className="flex gap-3 mb-12">
                {/* Stat Box 1 */}
                <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-5 backdrop-blur-md hover:bg-white/15 transition-colors group min-w-[140px]">
                  <div className="text-2xl font-black text-white mb-0.5">
                    {AR500_DATA.thicknessRange}
                  </div>
                  <div className="text-[9px] font-black text-blue-100 uppercase tracking-[0.1em] opacity-80">
                    {AR500_DATA.thicknessCount}
                  </div>
                </div>
                {/* Stat Box 2 */}
                <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-5 backdrop-blur-md hover:bg-white/15 transition-colors group min-w-[140px]">
                  <div className="text-2xl font-black text-white mb-0.5">
                    {AR500_DATA.productionTime}
                  </div>
                  <div className="text-[9px] font-black text-blue-100 uppercase tracking-[0.1em] opacity-80">
                    FAST TURNAROUND
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-5">
                <Button className="h-14 px-10 bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-xl font-bold uppercase tracking-[0.15em] text-[11px] shadow-[0_15px_30px_-5px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02] active:scale-95 group">
                  GET INSTANT PRICING
                  <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Right Part Image - Professional Integration */}
            <div className="lg:col-span-6 relative h-[450px] lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-blue-400/10 blur-[120px] rounded-full" />
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={AR500_DATA.heroImg}
                  alt="Industrial AR500 Steel Cog"
                  width={700}
                  height={700}
                  priority
                  className="object-contain drop-shadow-[0_40px_60px_rgba(0,0,0,0.4)] transition-all duration-1000 hover:scale-105 select-none"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Secondary Nav Bar - MechHub Styling */}
      <nav className="bg-white border-b border-slate-200 z-40">
        <div className="container mx-auto px-6">
          <div className="flex justify-center gap-10">
            {SECONDARY_NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setActiveTab(item.label);
                  const element = document.getElementById(item.id);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`py-6 text-[10px] font-bold tracking-[0.25em] transition-all relative ${activeTab === item.label ? 'text-[#2F5FA7]' : 'text-blue-100 hover:text-slate-900'}`}
              >
                {item.label}
                {activeTab === item.label && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 4. Quick Look Content Section */}
      <section id="quick-look" className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-12 uppercase tracking-tight">
            AR500 <span className="text-[#2F5FA7]">size and thickness</span> options
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Left Card: Cut Sizes */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-[9px] font-black text-blue-100 uppercase tracking-[0.3em] mb-10">
                Cut Sizes
              </div>

              <div className="relative aspect-[4/3] bg-slate-50/50 rounded-2xl flex items-center justify-center mb-16 border border-slate-100 overflow-hidden">
                <div className="absolute inset-0 blueprint-grid opacity-[0.05]" />
                <div className="flex items-end gap-6 relative z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-12 bg-slate-200 rounded-sm border border-slate-300 flex items-center justify-center text-[10px] font-bold text-blue-200">
                      A
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-32 h-44 bg-slate-200/80 rounded-xl border border-slate-300 flex items-center justify-center text-lg font-black text-blue-100">
                      B
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-40 h-56 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-lg font-black text-slate-200">
                      C
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {[
                  { label: 'A. .25" x .375" min', cta: 'Instant Pricing' },
                  { label: 'B. 30" x 44" max', cta: 'Instant Pricing' },
                  { label: 'C. 30" x 56" max', cta: 'Custom Quote', dashed: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0"
                  >
                    <span className="text-sm font-black text-slate-700 uppercase tracking-wide">
                      {item.label}
                    </span>
                    <button
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${item.dashed ? 'bg-white border-2 border-dashed border-slate-200 text-blue-100 hover:border-slate-300 hover:text-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {item.cta}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Card: Thicknesses */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-[9px] font-black text-blue-100 uppercase tracking-[0.3em] mb-6">
                Thicknesses
              </div>
              <p className="text-xs font-bold text-blue-200 mb-8">
                Laser cut, +/- .005" tolerance
              </p>

              <div className="space-y-3 mb-10">
                {thicknesses.map((t, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between group hover:bg-white hover:border-[#2F5FA7]/20 transition-all cursor-default"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-900 group-hover:text-[#2F5FA7] transition-colors">
                        {t.inch}
                      </span>
                      <span className="text-[9px] font-bold text-blue-100 uppercase tracking-widest">
                        {t.mm}
                      </span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                ))}
              </div>

              <Link
                href="#specifications"
                className="inline-flex items-center text-[10px] font-black text-[#2F5FA7] hover:text-[#1e40af] uppercase tracking-widest group border-b border-[#2F5FA7]/20 pb-1"
              >
                VIEW FULL SPECIFICATIONS{' '}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Specifications Section */}
      <section id="specifications" className="py-24 bg-slate-50/50 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rotate-45 border-l border-t border-slate-100 hidden lg:block" />

        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-12 uppercase tracking-tight">
            AR500 <span className="text-[#2F5FA7]">sheet metal material</span> details and
            specifications
          </h2>

          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-stretch">
            {/* 1. Vertical Sidebar Selector */}
            <div className="w-full lg:w-48 flex flex-col gap-2">
              <div className="flex gap-1 mb-4 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setUnit('inch')}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${unit === 'inch' ? 'bg-white text-slate-900 shadow-sm' : 'text-blue-100 hover:text-slate-600'}`}
                >
                  Inch
                </button>
                <button
                  onClick={() => setUnit('mm')}
                  className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${unit === 'mm' ? 'bg-white text-slate-900 shadow-sm' : 'text-blue-100 hover:text-slate-600'}`}
                >
                  MM
                </button>
              </div>

              <div className="space-y-2">
                {thicknesses.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedThicknessIndex(idx)}
                    className={`w-full group px-4 py-4 rounded-xl flex items-center justify-between transition-all ${selectedThicknessIndex === idx ? 'bg-white shadow-md border border-slate-200' : 'bg-transparent border border-transparent hover:bg-slate-100'}`}
                  >
                    <span
                      className={`text-xs font-black transition-colors ${selectedThicknessIndex === idx ? 'text-[#2F5FA7]' : 'text-blue-200 group-hover:text-slate-900'}`}
                    >
                      {unit === 'inch' ? t.inch : t.mm}
                    </span>
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${selectedThicknessIndex === idx ? 'bg-black ' + t.barWidth : 'bg-slate-300 w-6 group-hover:bg-slate-400'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Main Specification Card */}
            <div className="flex-1 bg-white border border-slate-200 rounded-[32px] p-8 lg:p-14 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] rotate-90 origin-right translate-x-4">
                  SPECIFICATIONS
                </div>
              </div>

              <div className="text-center mb-10">
                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  {unit === 'inch' ? currentThickness.inch : currentThickness.mm} AR500 Steel
                </h3>
                <div className="text-[10px] font-black text-blue-100 uppercase tracking-[0.2em] mt-2">
                  Material Details & Specifications
                </div>
              </div>

              <div className="flex justify-center mb-12">
                <div className="relative w-full max-w-sm aspect-video">
                  <Image
                    src={AR500_DATA.heroImg}
                    alt="AR500 Specification"
                    fill
                    className="object-contain drop-shadow-2xl transition-transform duration-700 hover:scale-105"
                  />
                </div>
              </div>

              <div className="max-w-xl mx-auto space-y-3">
                <div className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl bg-slate-50 shadow-inner group hover:bg-white hover:border-[#2F5FA7]/20 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                      <Search className="w-5 h-5 text-[#2F5FA7]" />
                    </div>
                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest pl-4">
                      Laser Cutting
                    </span>
                  </div>
                  <button className="text-[10px] font-black text-[#2F5FA7] hover:underline uppercase tracking-widest flex items-center gap-2">
                    VIEW SPECS <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Feature Chart Section */}
      <section id="about" className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 text-center mb-16 uppercase tracking-tight">
            AR500 <span className="text-[#2F5FA7]">feature chart</span>
          </h2>

          <div className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {[
                { label: 'Strength', rating: 5 },
                { label: 'Corrosion Resistance', rating: 2 },
                { label: 'Weldability', rating: 2 },
                { label: 'Toughness', rating: 3 },
                { label: 'Formability', rating: 2 },
                { label: 'Machinability', rating: 2 },
                { label: 'Heat Treating', rating: 3 },
                { label: 'Strength-to-Weight Ratio', rating: 5 },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-6 border-slate-100 ${i % 2 === 0 ? 'md:border-r' : ''} ${i < 6 ? 'border-b' : ''} ${i >= 6 && i < 8 ? 'md:border-b-0 border-b' : ''}`}
                >
                  <span className="text-[13px] font-black text-slate-900 uppercase tracking-wide">
                    {item.label}
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((dot) => (
                      <div
                        key={dot}
                        className={`w-3.5 h-3.5 rounded-full ${dot <= item.rating ? 'bg-black' : 'bg-slate-200'}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. "What is AR500?" Section */}
      <section className="py-24 bg-white overflow-hidden border-t border-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl mx-auto">
            <div className="lg:w-1/3 relative">
              <Image
                src={AR500_DATA.heroImg}
                alt="Cog"
                width={400}
                height={400}
                className="object-contain drop-shadow-2xl"
              />
            </div>
            <div className="lg:w-2/3">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-8 uppercase tracking-tight">
                What is <span className="text-[#2F5FA7]">AR500?</span>
              </h2>
              <p className="text-lg text-slate-600 font-medium leading-relaxed mb-10">
                Our AR500 steel is similar to AR400 with an even higher hardness, making it more
                resilient and suitable for applications where extreme abrasion resistance is
                required. It is built to withstand the same gradual abrasion over extended periods
                of time, making it well suited for large machinery that endures constant wear. Like
                its AR counterparts, it also offers outstanding economical value by requiring little
                maintenance.
              </p>

              <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-tight">
                What can you make with <span className="text-[#2F5FA7]">AR500 parts?</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                {[
                  'Combat robot armor plates',
                  'Shooting targets',
                  'Aerospace structural supports',
                  'Sprockets/gears',
                  'Heavy equipment bed liners',
                  'Furniture frames',
                  'Heavy equipment wear plates',
                  'Chassis components',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" />
                    <span className="text-sm font-bold text-slate-600">{item}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3px]" />
                  <span className="text-sm font-bold text-slate-600 italic">And so much more!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Similar Materials Section */}
      <section className="py-16 bg-white overflow-hidden border-t border-slate-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-10 tracking-tight">
            Materials similar to AR500
          </h2>
          <div className="max-w-[400px] mx-auto">
            <Link
              href="/materials/ar400"
              className="group block bg-white border border-slate-100 rounded-[16px] overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="flex items-center h-20">
                <div className="w-20 h-full relative bg-slate-900 flex-shrink-0">
                  <Image
                    src="/ar400_sheet.png"
                    alt="AR400"
                    fill
                    className="object-cover opacity-90 group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 px-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight text-left">
                      AR400
                    </h3>
                    <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest mt-0.5 text-left">
                      1 thickness: .250"
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#2F5FA7] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. AR500 FAQs Section */}
      <section id="resources" className="py-24 bg-slate-50/50 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rotate-45 border-l border-t border-slate-100 hidden lg:block" />
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 text-center mb-16 uppercase tracking-tight">
            AR500 <span className="text-[#2F5FA7]">FAQs</span>
          </h2>
          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                q: 'What thicknesses does SendCutSend offer AR500 in?',
                a: 'SendCutSend offers AR500 in five thickness options: .119", .187", .250", .375", and .500".',
              },
              {
                q: 'What are the minimum and maximum sizes for cutting AR500?',
                a: 'The smallest part size available is .25" x .375", while the largest part supported is 30" x 44". For larger projects, custom quotes are available for sizes up to 30" x 56".',
              },
              {
                q: 'What additional services are available for AR500?',
                a: 'You can add Laser Cutting to your AR500 parts.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className={`bg-[#F9FAFB] rounded-[24px] overflow-hidden transition-all duration-300 ${expandedFaq === i ? 'shadow-sm ring-1 ring-[#2F5FA7]/10' : ''}`}
              >
                <div
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="p-8 md:p-10 flex items-center gap-6 cursor-pointer group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${expandedFaq === i ? 'bg-blue-600 text-white rotate-90' : 'bg-white border border-slate-100 text-blue-100 group-hover:text-[#2F5FA7]'}`}
                  >
                    {expandedFaq === i ? (
                      <Minus className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-base md:text-lg font-bold transition-colors ${expandedFaq === i ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'}`}
                  >
                    {faq.q}
                  </span>
                </div>
                {expandedFaq === i && (
                  <div className="px-8 md:px-24 pb-12 animate-in fade-in slide-in-from-top-4 duration-500">
                    <p className="text-base text-blue-200 font-medium leading-relaxed whitespace-pre-line max-w-3xl">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
