'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/utils';
import { Reveal, Tag } from './primitives';

const SEGMENTS = [
  {
    title: 'Robotics',
    image: '/home/seg-robotics.jpg',
    body: "Chassis plates, motor mounts, servo brackets, custom brackets, custom mounts etc, precision-cut and ready to bolt. We've helped student teams go from CAD to competition-ready in under a week.",
    pills: ['Sheet Cutting', 'CNC Milling', 'Anodizing'],
    cta: 'Get Your Robot Parts',
    href: '/login',
  },
  {
    title: 'Drones & UAVs',
    image: '/home/seg-drone.jpg',
    body: 'Carbon fiber frames, aluminium arms, custom mounts, cut to your exact geometry. No minimums. No vendor negotiations. Just upload and fly.',
    pills: ['Carbon Fiber', '3D Printing', 'Precision Cutting'],
    cta: 'Get Your Drone Parts',
    href: '/login',
  },
  {
    title: 'Electric Vehicles',
    image: '/home/seg-ev.jpg',
    body: 'Enclosures, brackets, motor mounts, battery holders, custom mounts, custom brackets etc manufactured with EV-grade tolerances. Built for student formula teams and EV startups alike.',
    pills: ['CNC Turning', 'Sheet Metal', 'Powder Coating'],
    cta: 'Get Your EV Parts',
    href: '/login',
  },
];

const AUDIENCE = ['Startups', 'Manufacturers', 'Designers', 'Student Teams'];
const ASSURANCES = ['From CAD files to real parts', 'CNC Precision', 'Quality Checked', 'On-time Delivery'];

export function SegmentSection() {
  const [active, setActive] = useState(0);
  const segment = SEGMENTS[active];

  return (
    <section className="mx-auto max-w-[1400px] px-4 py-28 sm:px-5">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Reveal>
            <Tag>For Every Builder</Tag>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
              What Are You <span className="lp-accent-serif">Building?</span>
            </h2>
          </Reveal>
          <Reveal delay={150}>
            <p className="mt-5 max-w-md text-lp-muted-fg">
              MechHub is purpose-built for India&apos;s next generation of hardware innovators.
            </p>
          </Reveal>

          <div className="mt-10 border-t border-lp-border" role="tablist" aria-label="Industries">
            {SEGMENTS.map((s, i) => (
              <button
                key={s.title}
                role="tab"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className={cn(
                  'flex w-full items-center justify-between border-b border-lp-border py-4 text-left transition-all',
                  active === i ? 'pl-3 text-lp-primary' : 'hover:pl-2'
                )}
              >
                <span className="flex gap-6">
                  <span className="lp-label-mono pt-1 text-lp-muted-fg">0{i + 1}.</span>
                  <span className="text-lg">{s.title}</span>
                </span>
                <ArrowRight className={cn('size-4 transition-transform', active === i && '-rotate-45')} />
              </button>
            ))}
          </div>

          <p className="lp-label-mono mt-6 text-lp-muted-fg">Designed for: {AUDIENCE.join(' · ')}</p>
        </div>

        <div className="relative overflow-hidden rounded-sm bg-lp-primary text-lp-primary-fg" role="tabpanel">
          <div key={segment.image} className="relative h-72 animate-in fade-in zoom-in-105 duration-700">
            <Image
              src={segment.image}
              alt={segment.title}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
          </div>
          <div key={active} className="p-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-3xl">{segment.title}</h3>
            <p className="mt-3 text-sm opacity-85">{segment.body}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {segment.pills.map((pill) => (
                <span key={pill} className="lp-label-mono border border-lp-primary-fg/40 px-2 py-1">
                  {pill}
                </span>
              ))}
            </div>
            <Link href={segment.href} className="lp-label-mono mt-6 inline-flex items-center gap-2 hover:underline">
              → {segment.cta}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-4">
        {ASSURANCES.map((item, i) => (
          <Reveal key={item} delay={i * 80} className="flex items-center gap-3 border-t border-lp-fg pt-4">
            <Check className="size-4 text-lp-primary" />
            {item}
          </Reveal>
        ))}
      </div>
    </section>
  );
}
