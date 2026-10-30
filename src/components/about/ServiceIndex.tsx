'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/home/primitives';
import { cn } from '@/utils';

type Service = { name: string; category: string; image: string; href: string };

/** Index of services. Hovering or focusing a row swaps the pinned preview on desktop. */
export function ServiceIndex({ services }: { services: Service[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="mt-14 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <ul className="border-t border-lp-border">
        {services.map((service, i) => (
          <li key={service.href} className="border-b border-lp-border">
            <Reveal delay={i * 40}>
              <Link
                href={service.href}
                data-active={active === i}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="about-svc-row group flex items-center gap-4 py-3 pr-3 lg:py-4 lg:pl-3"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-sm lg:hidden">
                  <Image src={service.image} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="lp-label-mono hidden w-8 opacity-60 lg:block">0{i + 1}</span>
                <span className="min-w-0 flex-1 text-lg tracking-tight transition-transform duration-300 group-data-[active=true]:lg:translate-x-2 md:text-2xl">
                  {service.name}
                </span>
                <span className="lp-label-mono hidden opacity-70 md:block">{service.category}</span>
                <ArrowRight className="size-4 shrink-0 transition-transform group-data-[active=true]:-rotate-45" />
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>

      <div className="hidden self-start lg:sticky lg:top-28 lg:block">
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-lp-muted">
            {services.map((service, i) => (
              <Image
                key={service.href}
                src={service.image}
                alt=""
                fill
                sizes="(min-width: 1400px) 600px, 42vw"
                className={cn(
                  'object-cover transition-[opacity,transform] duration-700',
                  active === i ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                )}
              />
            ))}
            <span className="lp-tag absolute bottom-3 left-3">
              0{active + 1} / 0{services.length}
            </span>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
