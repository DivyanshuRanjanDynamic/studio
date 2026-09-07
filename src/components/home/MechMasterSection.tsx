'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CheckCircle2, Shield, Clock, ArrowRight, Settings, Star } from 'lucide-react';

const buyerBadges = [
  { icon: CheckCircle2, label: 'QC Inspected' },
  { icon: Shield, label: 'NDA Signed' },
  { icon: Clock, label: 'On-Time Rated' },
];

const supplierBenefits = [
  'Steady order flow from verified buyers',
  'No sales calls — orders come to you',
  'Transparent payout with every delivery',
];

export function MechMasterSection() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('mh-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '-30px' }
    );

    [headerRef.current, leftRef.current, rightRef.current].forEach(
      (el) => el && observer.observe(el)
    );
    return () => observer.disconnect();
  }, []);

  return (
    <section id="mechmaster" className="py-24 md:py-32 bg-[#16283e] border-b border-[#2a3a56]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mh-reveal">
          <span className="mh-pill-dark mb-4 inline-flex">THE NETWORK</span>
          <h2 className="mh-h2 text-white font-['Lora',serif] mt-4">
            Powered by Verified{' '}
            <span className="text-[#4fd8e8]">MechMasters</span>
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-14">

          {/* ── Left: For Buyers ── */}
          <div
            ref={leftRef}
            className="mh-card-dark mh-reveal p-8 md:p-10"
            style={{ transitionDelay: '0.1s' }}
          >
            <h3 className="mh-h3 text-white font-['Lora',serif] mb-3">Vetted Manufacturing Partners</h3>
            <p className="text-[#aab6c9] text-sm leading-relaxed font-normal">
              Your parts aren&apos;t made in a black box. Every order goes to a MechHub-certified
              MechMaster — a verified manufacturing partner who has passed our technical and
              delivery quality standards.
            </p>

            {/* Badge pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              {buyerBadges.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#101d33] border border-[#2a3a56] text-[#aab6c9] text-xs font-semibold"
                >
                  <Icon size={14} className="text-[#16a34a]" />
                  {label}
                </div>
              ))}
            </div>

            {/* Mock partner card */}
            {/* TODO: Replace with real MechMaster partner profiles */}
            <div className="mt-8 rounded-[16px] border border-[#2a3a56] bg-[#101d33] p-6 relative overflow-hidden">
              <div className="relative z-10">
                {/* Header row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-[12px] bg-[#16283e] border border-[#2a3a56] flex items-center justify-center flex-shrink-0">
                    <Settings size={18} className="text-[#4fd8e8]" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Verified MechMaster</p>
                    <p className="text-[#aab6c9] text-xs flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] inline-block" />
                      Mumbai, India
                    </p>
                  </div>
                  <div className="ml-auto">
                    <span className="mh-pill-dark text-[10px]">VERIFIED</span>
                  </div>
                </div>

                {/* Capabilities */}
                <p className="text-[#6f95c9] text-xs uppercase font-bold tracking-wider mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Sheet Cutting', 'CNC', 'Bending'].map((cap) => (
                    <span key={cap} className="px-2.5 py-0.5 bg-[#16283e] text-[#aab6c9] border border-[#2a3a56] text-xs font-semibold rounded-full">{cap}</span>
                  ))}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                    ))}
                  </div>
                  <span className="text-[#aab6c9] text-xs font-medium">4.9 · 120 orders completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: For Suppliers ── */}
          <div
            ref={rightRef}
            className="mh-card-dark mh-reveal p-8 md:p-10 flex flex-col"
            style={{ transitionDelay: '0.2s' }}
          >
            <h3 className="mh-h3 text-white font-['Lora',serif] mb-3">Become a MechMaster</h3>
            <p className="text-[#aab6c9] text-sm leading-relaxed font-normal">
              Own a machine shop? CNC unit? Laser cutter? Join India&apos;s fastest-growing
              manufacturing network and get orders directly through the MechHub platform.
            </p>

            {/* Benefits */}
            <div className="flex flex-col gap-4 mt-8">
              {supplierBenefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 text-[#aab6c9] text-sm font-medium">
                  <ArrowRight size={16} className="text-[#4fd8e8] mt-0.5 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>

            {/* Divider + stats */}
            <div className="mt-auto pt-8 border-t border-[#2a3a56] grid grid-cols-3 gap-4 text-center">
              {[
                { val: '₹0', label: 'Setup Cost' },
                { val: '24hr', label: 'Onboarding' },
                { val: '100%', label: 'Transparent' },
              ].map(({ val, label }) => (
                <div key={label}>
                  <p className="text-[#4fd8e8] font-extrabold text-lg">{val}</p>
                  <p className="text-[#6f95c9] text-xs mt-0.5 font-medium">{label}</p>
                </div>
              ))}
            </div>

            <Link href="/onboard" className="mh-btn-primary mt-8 w-full justify-center">
              Apply to Join <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
