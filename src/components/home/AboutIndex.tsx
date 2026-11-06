'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Drone, Gear, Lightning, Robot } from '@phosphor-icons/react/dist/ssr';
import { cn } from '@/utils';
import { Accent, Reveal, Tag } from './primitives';

const ITEMS = [
  { label: 'Robot chassis and brackets', icon: Robot, image: '/home/seg-robotics.jpg', href: '/services/precision-sheet-cutting' },
  { label: 'Drone frames and arms', icon: Drone, image: '/home/seg-drone.jpg', href: '/services/precision-sheet-cutting' },
  { label: 'EV enclosures and mounts', icon: Lightning, image: '/home/seg-ev.jpg', href: '/services/bending' },
  { label: 'Machined shafts and couplings', icon: Gear, image: '/home/svc-2.jpg', href: '/services/cnc-machining' },
];

const FOUNDERS = [
  { name: 'Divyanshu Ranjan', photo: '/about/founders/divyanshu-ranjan.jpg' },
  { name: 'Ujjwal Jha', photo: '/about/founders/ujjwal-jha.webp' },
  { name: 'Dristi Sengupta', photo: '/about/founders/dristi-sengupta.webp' },
];

/** About MechHub: what we make (hover or focus a row to swap the picture) and why we exist. */
export function AboutIndex() {
  const [active, setActive] = useState(0);

  return (
    <section aria-labelledby="about-index-heading" className="border-y border-lp-border px-4 py-16 md:py-24">
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-24">
        <div>
          <Reveal>
            <Tag>About</Tag>
            <h2 id="about-index-heading" className="heading-2 mt-4 max-w-[680px]">
              Manufacturing with speed <br className="hidden md:block" />
              and <Accent>precision</Accent>
            </h2>
          </Reveal>

          <Reveal as="div" className="mt-12">
            <ul className="divide-y divide-lp-border border-y border-lp-border">
              {ITEMS.map(({ label, icon: Icon, href }, i) => (
                <li key={label}>
                  <Link
                    href={href}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    aria-current={active === i ? 'true' : undefined}
                    className={cn(
                      'group flex items-center gap-4 rounded py-3 transition-colors duration-300 ease-lp',
                      active === i ? 'text-lp-primary' : 'hover:text-lp-primary'
                    )}
                  >
                    <span className="lp-mono w-8 text-lp-muted-fg">0{i + 1}.</span>
                    <span className="title-3 flex-1">{label}</span>
                    <Icon aria-hidden="true" className="size-5" weight={active === i ? 'fill' : 'regular'} />
                    <ArrowRight
                      aria-hidden="true"
                      className={cn(
                        'size-4 transition-transform duration-300 ease-lp',
                        active === i ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-100'
                      )}
                      weight="bold"
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="lp-duotone lp-marks relative mt-4 aspect-[2/1] overflow-hidden rounded-2xl text-lp-primary-fg">
              {ITEMS.map((item, i) => (
                <Image
                  key={item.image}
                  src={item.image}
                  alt={i === active ? `${item.label} made on MechHub` : ''}
                  fill
                  sizes="(min-width: 1200px) 640px, (min-width: 1024px) 55vw, 100vw"
                  className={cn(
                    'object-cover transition-[opacity,transform] duration-500 ease-lp',
                    i === active ? 'scale-100 opacity-100' : 'scale-105 opacity-0'
                  )}
                />
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={100} className="flex flex-col justify-between gap-12">
          <div>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {FOUNDERS.map((f) => (
                  <span key={f.name} className="relative size-10 overflow-hidden rounded-full border-2 border-lp-bg bg-lp-muted">
                    <Image src={f.photo} alt={f.name} fill sizes="40px" className="object-cover" />
                  </span>
                ))}
              </div>
              <div>
                <p className="title-4">The MechHub founders</p>
                <Link href="/about#founders" className="caption-2 text-lp-primary underline underline-offset-4 hover:opacity-80">
                  Meet the team
                </Link>
              </div>
            </div>
            <div className="body-6 mt-8 space-y-4 text-lp-muted-fg">
              <p>
                Getting one custom part made in India still means emailing workshops, waiting days for answers and
                hitting minimum orders built for factories. We built MechHub so that anyone with a design can get it
                made.
              </p>
              <p>
                Upload a CAD file and the platform prices it instantly. A vetted MechMaster from our partner network
                cuts, machines and finishes it under NDA, and you follow every stage until it reaches your door.
              </p>
            </div>
          </div>
          <p className="lp-mono max-w-[280px] text-lp-muted-fg">
            Every part is QC inspected before it leaves the workshop.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
