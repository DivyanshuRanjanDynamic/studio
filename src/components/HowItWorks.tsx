'use client';

import React, { useRef, useEffect } from 'react';
import { useState } from 'react';
import { Settings, Upload, Zap, Package, Play, ArrowRight, ShieldCheck } from 'lucide-react';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

export function HowItWorks() {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoUrl = "https://marketing-video-mechhub.s3.eu-north-1.amazonaws.com/export-1790457526275.mp4"

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.5;
    }
  }, []);

  return (
    <section id="how-it-works" className="py-20 md:py-28 relative overflow-hidden bg-white">
      {/* Background patterns */}
      <div className="absolute inset-0 blueprint-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(47,95,167,0.05),transparent_50%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-24">
          <ScrollReveal variant="fade-down" delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2F5FA7] mb-6">
              The MechHub Process
            </div>
          </ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#0F172A] mb-5 leading-tight">
            <TextReveal text="See How It Works" />
          </h2>
          <ScrollReveal variant="fade-up" delay={200}>
            <p className="text-[#64748B] max-w-xl mx-auto text-sm md:text-base font-medium text-balance">
              From design file to finished part — in days, not weeks.
            </p>
          </ScrollReveal>
        </div>

        {/* Video Block */}
        <ScrollReveal variant="scale-in" delay={150} className="max-w-4xl mx-auto mb-16 md:mb-24">
          <div className="relative group rounded-2xl md:rounded-3xl p-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 shadow-[0_30px_70px_rgba(47,95,167,0.15)] transition-all duration-500 hover:shadow-[0_40px_80px_rgba(47,95,167,0.25)]">
            <div className="relative aspect-video w-full rounded-xl md:rounded-[22px] overflow-hidden bg-slate-950 flex items-center justify-center border border-white/10">
              {
                <video
                  ref={videoRef}
                  src={videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  onLoadedMetadata={(e) => {
                    e.currentTarget.playbackRate = 1.5;
                  }}
                  className="w-full h-full object-contain"
                />
              }
            </div>
          </div>
          <p className="text-center mt-6 text-slate-500 text-xs md:text-sm font-semibold tracking-tight">
            Watch how a student team got their drone frame manufactured in 3 days.
          </p>
        </ScrollReveal>

        {/* Stepper Grid */}
        <div className="relative max-w-5xl mx-auto px-4 md:px-0">
          {/* Desktop Connecting Line */}
          <div className="hidden lg:block absolute top-[34px] left-[10%] right-[10%] z-0 h-0.5 bg-slate-100" />

          {/* Stepper items */}
          <div className="flex flex-col lg:grid lg:grid-cols-4 gap-12 lg:gap-8 relative z-10">
            {[
              {
                num: '01',
                icon: Settings,
                title: 'Choose options',
                desc: 'Select manufacturing process, material, and finishing options.',
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
              <ScrollReveal
                key={step.num}
                variant="fade-up"
                staggerIndex={i}
                staggerDelay={150}
                className="flex flex-row lg:flex-col items-start lg:items-center text-left lg:text-center group"
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
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
