'use client';

import React from 'react';

const STEPS = [
  {
    num: '01',
    label: 'Upload',
    sublabel: 'CAD File',
    desc: 'STEP / DXF / DWG',
    icon: (
      <path d="M12 16V4m0 0L8 8m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    num: '02',
    label: 'Instant',
    sublabel: 'Quote & DFM',
    desc: 'Real-time pricing',
    icon: (
      <path d="M9 7h6m-6 4h6m-6 4h4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    num: '03',
    label: 'Precision',
    sublabel: 'Manufacturing',
    desc: 'CNC / Laser / Bend',
    icon: (
      <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066zM15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    num: '04',
    label: 'Quality Check',
    sublabel: '& Delivery',
    desc: 'Pan-India shipping',
    icon: (
      <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
];

export function ProcessIllustration() {
  return (
    <div className="w-full aspect-[4/5] bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 rounded-2xl overflow-hidden relative p-6 md:p-8 flex flex-col justify-between shadow-lg">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* Glow accent */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#2563eb]/20 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between py-2">
        {STEPS.map((step, i) => (
          <div key={i} className="relative">
            {/* Connecting line */}
            {i < STEPS.length - 1 && (
              <div className="absolute left-[23px] top-[52px] w-px h-[calc(100%+8px)] bg-gradient-to-b from-[#2563eb]/40 to-[#2563eb]/10" />
            )}

            <div className="flex items-start gap-4">
              {/* Icon circle */}
              <div className="w-[48px] h-[48px] rounded-xl bg-white/[0.06] border border-white/[0.1] flex items-center justify-center shrink-0 backdrop-blur-sm">
                <svg className="w-5 h-5 text-[#60a5fa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {step.icon}
                </svg>
              </div>

              {/* Content */}
              <div className="pt-0.5">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="text-[10px] font-mono font-semibold text-[#60a5fa]/70 tracking-wider">{step.num}</span>
                  <span className="text-sm font-semibold text-white/90 tracking-tight">{step.label}</span>
                </div>
                <p className="text-[13px] text-white/50 font-medium leading-snug">{step.sublabel}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-mono font-medium tracking-wider uppercase text-white/30 bg-white/[0.04] border border-white/[0.06]">
                  {step.desc}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom badge */}
      <div className="relative z-10 mt-4 flex items-center gap-2 justify-center">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] font-mono font-semibold uppercase tracking-widest text-white/40">Secure · NDA Protected</span>
        </div>
      </div>
    </div>
  );
}
