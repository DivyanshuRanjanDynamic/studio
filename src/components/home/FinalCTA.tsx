'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Lock, Zap, MapPin, PackageCheck } from 'lucide-react';
import { useUser } from '@/firebase';

const badges = [
  { icon: Lock, label: 'NDA Protected' },
  { icon: Zap, label: '72hr Turnaround' },
  { icon: MapPin, label: 'Made in India' },
  { icon: PackageCheck, label: 'No Minimums' },
];

export function FinalCTA() {
  const { user } = useUser();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const btnsRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  const uploadHref = user
    ? '/dashboard?tab=projects'
    : '/login?tab=register&redirect=/dashboard?tab=projects';

  useEffect(() => {
    const elements = [headingRef.current, subRef.current, btnsRef.current, badgesRef.current];
    const delays = [0, 0.1, 0.2, 0.4];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('mh-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '-30px' }
    );

    elements.forEach((el, i) => {
      if (el) {
        (el as HTMLElement).style.transitionDelay = `${delays[i]}s`;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="get-started"
      className="py-24 md:py-32  border-t border-[#2a3a56] relative overflow-hidden text-white"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[700px] h-[700px]  rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">

          {/* Heading */}
          <h2
            ref={headingRef}
            className="mh-h1 text-[#1b3357] font-semibold text-4xl md:text-5xl  mh-reveal drop-shadow-md"
          >
            Ready to Build{' '}
            <span className="text-[#1b3357]">Something Real?</span>
          </h2>

          {/* Subheading */}
          <p
            ref={subRef}
            className="text-[#1b3357] text-lg md:text-xl font-normal mt-6 max-w-xl mx-auto mh-reveal leading-relaxed"
          >
            Upload your design and get a quote in minutes.
            No minimums. No negotiation. Just fast, quality parts.
          </p>

          {/* CTA buttons */}
          <div
            ref={btnsRef}
            className="mt-10 flex flex-col sm:flex-row gap-4 justify-center mh-reveal"
          >
            <Link
              href={uploadHref}
              className="mh-btn-secondary-dark text-base hover:bg-blue-500 text-white px-8 py-3.5 justify-center"
            >
              Upload Your Design <ArrowRight size={18} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-3.5  hover:bg-blue-500 text-[#1b3357] border border-white/25 font-semibold text-base rounded-full shadow-md transition-all duration-300 justify-center"
            >
              Talk to an Engineer
            </Link>
          </div>

          {/* Trust badges */}
          <div
            ref={badgesRef}
            className="mt-14 flex flex-wrap justify-center gap-4 md:gap-6 mh-reveal"
          >
            {badges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#2a3a56] text-[#16283e] text-xs font-semibold backdrop-blur-md shadow-sm">
                <Icon size={14} className="text-[#0a0d11]" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
