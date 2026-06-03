'use client';

import React from 'react';
import { useState } from 'react';
import { Settings, Upload, Zap, Package, Play, ArrowRight, ShieldCheck } from 'lucide-react';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

export function HowItWorks() {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoUrl = "https://marketing-video-mechhub.s3.eu-north-1.amazonaws.com/Screen%20Recording%202026-04-25%20041930111.mp4?response-content-disposition=inline&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGkaCmV1LW5vcnRoLTEiRjBEAiALN6FCuSp%2F7TFZjib0YBMV%2FfDpzl7vua53PXZrbNvidwIgEwRvDkuZ7XYI%2FHXumEyR9ViKqMgI1%2B3MjRKn5DTilDQquQMIMhAAGgwxMjk1ODgxNTY1NTgiDMU11EkOwHDMXkxNbyqWAyzWrUgEdmLzYteTurN%2B310BilxYQhgYIG%2Bidd%2B7O4%2F9cL%2FSFu%2FbsU1BTehwqLBUCFiw0TpZA7pVnAGg0%2BqzjFOhVQsP4uJVcyw0mX8b71Q075joCJ1kwwfN3nUsd1q1u3hE50qnvfH7wAGSnbiyyLpzrHonkQdCVtFVBMccqW8WkOmFpNekdUDVLABeJ%2FhOXNGBa%2BPHWftU255c7%2BeD9AMl1LIC53cbHlu%2BTd1%2ByHWS26kIx39JtNfcoXiA9ogSmafOGuRylWMGhRNU8KwWly4nd7XAnF6x9pMKM639QVJ%2FkD4tPh4U67JxH1OdQp9o6AsQBF%2B5k3gcxDlfL3CKj5dEvDDDrjc3IH4sndytyt7yCk%2FQQxkElqfrEjwSNynLNr%2FO3Yqy0Hs4TWSaXGD22mfL0vVAIGPFPoyGicJwER5Le6PkWqW6qYFBGvQEVN1YAAIBpcDAJCCw6B9XkWaWJALZYnUyvfIqI2swxrxV%2BTXelLuWjK83XKzR%2BcldsS2MTJ%2BeCiMH8I1w0Kp3HYbe9qOTdit36i4wk9390AY63wI87IUf6U5Rh%2FL2Uch%2FlmWbbzMdAiKGgNBsJYwPEj1QWIgjewuBmvxOB86N4tzxVMixn%2B0IJafzy8XXHZdKdCt0cM2%2BU6oMv1lDu96%2F29d1csIXwR7XcuD3N46UA39i5gG%2BHmZQkshhqIE19BML8VOs5yVUmfDDErkrvR6CS5o3TEvazOn4tqVo5IKYYe%2B0B3D91e3z84Z5RykqZyxSQFL1bj9owJv0Z7Oj5MbRVMV3WxpQDcL%2BVlQuaEklhjrehMFu3J47i%2BhrvItpQal%2B38dHYDKjEPaBPdEPQ%2FoPVH9mEajnsKztgo7OH7R4hQ1xF5X4I5%2BIW%2BfyQZQWRr944d%2BP%2BwBkBjSmuizesXI1LkZprfUFXwze2Yo42kC6EkpLVh90vtltzam5MXekjQidpFq9dsLfnIJTrIz5iiwMeIq8IQ%2FwfZC887KqUa8e0LX0BdXrg1v9CYaSp81Y1Un18Xo%3D&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAR4LAOLCHCAD3V7KC%2F20260603%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20260603T004325Z&X-Amz-Expires=43200&X-Amz-SignedHeaders=host&X-Amz-Signature=273790c9571c85596da03f5629c0ee2541372d7bf82750b9805e874b130bfd9b";

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
                  src={videoUrl}
                  controls
                  autoPlay
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
