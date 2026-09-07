'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Cog, Wind, Zap, ArrowRight } from 'lucide-react';
import { staggerDelay } from '@/lib/animations';

const cards = [
  {
    icon: Cog,
    title: 'Robotics',
    image: '/segment_robotics.jpg',
    body: "Chassis plates, motor mounts, servo brackets , custom brackets ,custom mounts etc ,precision-cut and ready to bolt. We've helped student teams go from CAD to competition-ready in under a week.",
    pills: ['Sheet Cutting', 'CNC Milling', 'Anodizing'],
    cta: 'Get Your Robot Parts',
    href: '/login',
  },
  {
    icon: Wind,
    title: 'Drones & UAVs',
    image: '/segment_drone.jpg',
    body: 'Carbon fiber frames, aluminium arms, custom mounts ,  cut to your exact geometry. No minimums. No vendor negotiations. Just upload and fly.',
    pills: ['Carbon Fiber', '3D Printing', 'Precision Cutting'],
    cta: 'Get Your Drone Parts',
    href: '/login',
  },
  {
    icon: Zap,
    title: 'Electric Vehicles',
    image: '/segment_ev.jpg',
    body: 'Enclosures, brackets, motor mounts, battery holders , custom mounts,custom brackets  etc manufactured with EV-grade tolerances. Built for student formula teams and EV startups alike.',
    pills: ['CNC Turning', 'Sheet Metal', 'Powder Coating'],
    cta: 'Get Your EV Parts',
    href: '/login',
  },
];

const audiencePills = ['Startups', 'Manufacturers', 'Designers', 'Student Teams'];

export function SegmentSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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
      { threshold: 0.12, rootMargin: '-30px' }
    );

    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="who-is-this-for"
      ref={sectionRef}
      className="py-24 md:py-32 bg-[#f7f9fc] border-b border-[#e4e8f0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center">
          <span className="mh-pill mb-4 inline-flex">FOR EVERY BUILDER</span>
          <h2 className="mh-h2 text-[#14213d] mt-4 font-['Lora',serif]">
            What Are You{' '}
            <span className="text-[#2e5596]">Building?</span>
          </h2>
          <p className="text-[#64748b] text-lg max-w-2xl mx-auto mt-4 font-medium">
            MechHub is purpose-built for India&apos;s next generation of hardware innovators.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {cards.map((card, i) => (
            <div
              key={card.title}
              ref={(el) => { cardRefs.current[i] = el; }}
              className="mh-card-light mh-reveal overflow-hidden flex flex-col group hover:-translate-y-1 transition-all duration-300"
              style={{ transitionDelay: staggerDelay(i) }}
            >
              {/* Card Image Header */}
              <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-slate-100 border-b border-[#e4e8f0]">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
                <div className="absolute top-4 left-4 w-11 h-11 rounded-[12px] bg-white/90 backdrop-blur-md border border-white/60 shadow-sm flex items-center justify-center">
                  <card.icon size={22} className="text-[#2e5596]" />
                </div>
              </div>

              {/* Card Content */}
              <div className="p-7 flex flex-col flex-1 gap-5">
                <div>
                  <h3 className="mh-h3 text-[#14213d] mb-2 font-['Lora',serif]">{card.title}</h3>
                  <p className="text-[#64748b] text-sm leading-relaxed font-normal">{card.body}</p>
                </div>

                {/* Pills */}
                <div className="flex flex-wrap gap-2">
                  {card.pills.map((pill) => (
                    <span key={pill} className="px-3 py-1 bg-[#eef1f6] border border-[#e4e8f0] text-[#14213d] text-xs font-semibold rounded-full">
                      {pill}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href={card.href}
                  className="mt-auto pt-2 text-sm font-bold text-[#2e5596] flex items-center gap-1.5 hover:text-[#22406e] transition-colors group/link"
                >
                  {card.cta} <ArrowRight size={15} className="group-hover/link:translate-x-1.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Audience pills row */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <span className="text-sm font-semibold text-[#64748b] mr-2">Designed for:</span>
          {audiencePills.map((label) => (
            <span key={label} className="mh-pill">
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
