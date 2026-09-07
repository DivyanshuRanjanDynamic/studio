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
} from 'lucide-react';

// --- DATA ---

const AR400_DATA = {
  name: 'AR400 Steel Sheet Metal',
  thickness: '.250"',
  thicknessCount: '1 Thickness',
  productionTime: '2-4 days',
  heroImg: '/ar400_user_part.png', // UPDATED: Using user-provided part image
  bgImg: '/ar400_hero_bg.png',
};

const SECONDARY_NAV = [
  { label: 'QUICK LOOK', id: 'quick-look' },
  { label: 'SPECIFICATIONS', id: 'specifications' },
  { label: 'ABOUT', id: 'about' },
  { label: 'RESOURCES', id: 'resources' },
];

export default function Ar400Page() {
  const [activeTab, setActiveTab] = useState('QUICK LOOK');
  const [unit, setUnit] = useState<'inch' | 'mm'>('mm');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const convertValue = (val: string) => {
    if (unit === 'mm') return val;
    // Conversion for .250" / 6.35mm specifically based on reference
    return val === '6.35mm' ? '.250"' : val;
  };

  return (
    <main className="min-h-screen bg-white">
      <LandingNav />

      {/* 2. Cinematic Hero Section - Blue & White Theme */}
      <section className="relative min-h-[600px] bg-blue-600 flex items-center overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <Image
            src={AR400_DATA.bgImg}
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
                  Industrial Manufacturing
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-black text-white leading-[0.95] mb-10 uppercase tracking-tighter drop-shadow-sm">
                AR400
                <br />
                <span className="text-white">STEEL</span>
                <br />
                <span className="text-blue-100">SHEET METAL</span>
              </h1>

              <div className="flex gap-3 mb-12">
                {/* Stat Box 1 */}
                <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-5 backdrop-blur-md hover:bg-white/15 transition-colors group min-w-[140px]">
                  <div className="text-2xl font-black text-white mb-0.5">
                    {AR400_DATA.thickness}
                  </div>
                  <div className="text-[9px] font-black text-blue-100 uppercase tracking-[0.1em] opacity-80">
                    {AR400_DATA.thicknessCount}
                  </div>
                </div>
                {/* Stat Box 2 */}
                <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-5 backdrop-blur-md hover:bg-white/15 transition-colors group min-w-[140px]">
                  <div className="text-2xl font-black text-white mb-0.5">
                    {AR400_DATA.productionTime}
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
                  src={AR400_DATA.heroImg}
                  alt="Industrial AR400 Steel"
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

      {/* 3. Secondary Nav Bar - MechHub Styling (NON-STICKY) */}
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
                    element.scrollIntoView({ behavior: 'smooth' });
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

      {/* 4. Quick Look Content Section: Size and Thickness (Reference Image Style) */}
      <section id="quick-look" className="py-20 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-12 uppercase tracking-tight">
            AR400 <span className="text-[#2F5FA7]">size and thickness</span> options
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Left Card: Cut Sizes */}
            <div className="bg-white border border-slate-200 rounded-[24px] p-8 lg:p-10 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-[9px] font-black text-blue-100 uppercase tracking-[0.3em] mb-10">
                Cut Sizes
              </div>

              {/* Size Diagram */}
              <div className="relative aspect-[4/3] bg-slate-50/50 rounded-2xl flex items-center justify-center mb-16 border border-slate-100 overflow-hidden">
                <div className="absolute inset-0 blueprint-grid opacity-[0.05]" />
                <div className="flex items-end gap-6 relative z-10">
                  {/* Part A */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-12 bg-slate-200 rounded-sm border border-slate-300 flex items-center justify-center text-[10px] font-bold text-blue-200">
                      A
                    </div>
                  </div>
                  {/* Part B */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-32 h-44 bg-slate-200/80 rounded-xl border border-slate-300 flex items-center justify-center text-lg font-black text-blue-100">
                      B
                    </div>
                  </div>
                  {/* Part C (Dashed) */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-40 h-56 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-lg font-black text-slate-200">
                      C
                    </div>
                  </div>
                </div>
              </div>

              {/* Size List */}
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

              <div className="space-y-4 mb-12">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center justify-between group hover:bg-white hover:border-[#2F5FA7]/20 transition-all cursor-default">
                  <div className="flex flex-col">
                    <span className="text-xl font-black text-slate-900 group-hover:text-[#2F5FA7] transition-colors">
                      {AR400_DATA.thickness}
                    </span>
                    <span className="text-[10px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">
                      6.35mm
                    </span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>

              <Link
                href="#specifications"
                className="inline-flex items-center text-[11px] font-black text-[#2F5FA7] hover:text-[#1e40af] uppercase tracking-widest group border-b border-[#2F5FA7]/20 pb-1"
              >
                VIEW FULL SPECIFICATIONS{' '}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Specifications Section (Reference Image Style) */}
      <section id="specifications" className="py-24 bg-slate-50/50 relative">
        {/* Subtle decorative arrow/pointer from prev section */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rotate-45 border-l border-t border-slate-100 hidden lg:block" />

        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 text-center mb-12 uppercase tracking-tight">
            AR400 <span className="text-[#2F5FA7]">sheet metal material</span> details and
            specifications
          </h2>

          <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
            {/* Unit Toggle Column */}
            <div className="flex flex-col gap-2 w-full lg:w-32 pt-12">
              <button
                onClick={() => setUnit('inch')}
                className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all ${unit === 'inch' ? 'bg-slate-100 border-slate-200 shadow-inner' : 'bg-white border-transparent hover:bg-slate-50'}`}
              >
                <span
                  className={`text-[11px] font-black uppercase tracking-widest ${unit === 'inch' ? 'text-slate-900' : 'text-blue-100'}`}
                >
                  INCH
                </span>
                <div
                  className={`w-6 h-3 rounded-full relative transition-colors ${unit === 'inch' ? 'bg-slate-400' : 'bg-slate-200'}`}
                >
                  <div
                    className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${unit === 'inch' ? 'right-0.5' : 'left-0.5'}`}
                  />
                </div>
              </button>
              <button
                onClick={() => setUnit('mm')}
                className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all ${unit === 'mm' ? 'bg-slate-100 border-slate-200 shadow-inner' : 'bg-white border-transparent hover:bg-slate-50'}`}
              >
                <span
                  className={`text-[11px] font-black uppercase tracking-widest ${unit === 'mm' ? 'text-slate-900' : 'text-blue-100'}`}
                >
                  MM
                </span>
                <div
                  className={`w-6 h-3 rounded-full relative transition-colors ${unit === 'mm' ? 'bg-black' : 'bg-slate-200'}`}
                >
                  <div
                    className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${unit === 'mm' ? 'right-0.5' : 'left-0.5'}`}
                  />
                </div>
              </button>
            </div>

            {/* Content Card */}
            <div className="flex-1 bg-white border border-slate-200 rounded-[32px] p-8 lg:p-14 shadow-sm hover:shadow-md transition-shadow w-full">
              <div className="text-center mb-10">
                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight">
                  {unit === 'mm' ? '6.35mm' : '.250"'} AR400 Steel
                </h3>
              </div>

              <div className="flex justify-center mb-12">
                <div className="relative w-full max-w-md aspect-video">
                  <Image
                    src="/ar400_user_part.png"
                    alt="AR400 Specification Detail"
                    fill
                    className="object-contain opacity-90 drop-shadow-lg"
                  />
                </div>
              </div>

              <div className="max-w-xl mx-auto">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white shadow-sm hover:border-[#2F5FA7]/30 transition-all group">
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-widest pl-4">
                    Laser Cutting
                  </span>
                  <button className="text-[10px] font-black text-[#2F5FA7] hover:underline uppercase tracking-widest pr-4">
                    VIEW SPECS
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Instant Pricing CTA Bar (Reference Image Style) */}
      <section className="py-12 bg-[#F1F5F9] border-y border-slate-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center md:text-left">
            <div>
              <h3 className="text-2xl lg:text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">
                Get started with instant pricing!
              </h3>
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-blue-200 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                All uploads are secure and confidential
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="h-14 px-10 bg-blue-600 hover:bg-[#2F5FA7]/80 text-white rounded-xl font-bold uppercase tracking-[0.15em] text-[11px] shadow-lg transition-all hover:scale-[1.02]">
                UPLOAD YOUR FILE
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Feature Chart Section (Reference Image Style) */}
      <section id="about" className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 text-center mb-16 uppercase tracking-tight">
            AR400 <span className="text-[#2F5FA7]">feature chart</span>
          </h2>

          <div className="max-w-4xl mx-auto bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {[
                { label: 'Strength', rating: 5 },
                { label: 'Corrosion Resistance', rating: 2 },
                { label: 'Weldability', rating: 2 },
                { label: 'Toughness', rating: 4 },
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

      {/* 8. "What is AR400?" Content Section (Reference Image Style) */}
      <section className="py-24 bg-white overflow-hidden border-t border-slate-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16 max-w-6xl mx-auto">
            {/* Left Image Side */}
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-slate-100 blur-[80px] rounded-full opacity-50" />
              <div className="relative">
                <Image
                  src="/ar400_hero_bg.png" // Using existing steel texture/parts for description
                  alt="Industrial AR400 Steel Components"
                  width={600}
                  height={450}
                  className="object-contain drop-shadow-2xl"
                />
              </div>
            </div>

            {/* Right Text Content */}
            <div className="lg:w-1/2">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-8 uppercase tracking-tight">
                What is <span className="text-[#2F5FA7]">AR400?</span>
              </h2>

              <div className="space-y-6">
                <p className="text-lg text-slate-600 font-medium leading-relaxed">
                  AR400 Steel is a high-strength, abrasion-resistant alloy that is specifically
                  engineered to withstand wear and impact in challenging environments. It has
                  exceptional durability and resistance to surface abrasion and gouging.
                </p>
                <p className="text-lg text-slate-600 font-medium leading-relaxed">
                  You'll find this steel in applications such as construction machinery, mining
                  equipment, and manufacturing components subject to continuous wear.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Similar Materials Section (Miniature Reference Style) */}
      <section className="py-16 bg-white overflow-hidden border-t border-slate-50">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 text-center mb-10 tracking-tight">
            Materials similar to AR400
          </h2>

          <div className="max-w-[400px] mx-auto">
            <Link
              href="/materials/ar500"
              className="group block bg-white border border-slate-100 rounded-[16px] overflow-hidden hover:shadow-lg hover:border-[#2F5FA7]/20 transition-all"
            >
              <div className="flex items-center h-20">
                <div className="w-20 h-full relative bg-slate-900 flex-shrink-0">
                  <Image
                    src="/ar500_sheet.png"
                    alt="AR500 Steel Sheet"
                    fill
                    className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                  />
                </div>
                <div className="flex-1 px-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                      AR500
                    </h3>
                    <p className="text-[9px] font-bold text-blue-100 uppercase tracking-widest mt-0.5">
                      5 thicknesses: .119" – .500"
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#2F5FA7] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 10. AR400 FAQs Section (Interactive Accordion Style) */}
      <section id="resources" className="py-24 bg-slate-50/50 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rotate-45 border-l border-t border-slate-100 hidden lg:block" />

        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 text-center mb-16 uppercase tracking-tight">
            AR400 <span className="text-[#2F5FA7]">FAQs</span>
          </h2>

          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                q: 'What thicknesses does SendCutSend offer AR400 in?',
                a: 'SendCutSend offers AR 400 in one thickness option: .250" (6.35mm).',
              },
              {
                q: 'What are the minimum and maximum sizes for cutting AR400?',
                a: 'When ordering AR 400 through SendCutSend, there are specific size and thickness parameters to keep in mind. For instant quoting, the smallest part size available is .25" x .375", while the largest part supported is 30" x 44". For larger projects, custom quotes are available for sizes up to 30" x 56".',
              },
              {
                q: 'What additional services are available for AR400?',
                a: 'You can add the following services to your AR400 parts:\nLaser Cutting',
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
