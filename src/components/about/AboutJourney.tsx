'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Check, FileBox, Lock, Truck } from 'lucide-react';
import { Reveal, Tag } from '@/components/home/primitives';
import { cn } from '@/utils';

const STEPS = [
  {
    title: 'Upload Your Design',
    body: 'Drop a STEP, DXF or DWG file into a secure, NDA-protected portal. Your design stays yours.',
  },
  {
    title: 'Choose Options, Get a Quote',
    body: 'Pick your process, material, thickness and finish, then get an instant or rapid quote with a full cost breakdown and no hidden fees.',
  },
  {
    title: 'A MechMaster Makes It',
    body: 'Your order goes to a vetted manufacturing partner. Follow it in real time, from production through quality check.',
  },
  {
    title: 'Delivered Pan-India',
    body: 'Inspected parts ship straight to your door, with a 72-hour average turnaround.',
  },
];

const QUOTE_OPTIONS = [
  ['Process', 'Laser Cutting'],
  ['Material', 'Aluminium'],
  ['Thickness', '3 mm'],
  ['Finish', 'Anodized'],
];

const ORDER_STAGES = ['Quote Approved', 'In Production', 'Quality Checked', 'Shipped'];

const rise = (i: number) => ({ '--i': i }) as CSSProperties;

function UploadScreen() {
  return (
    <div>
      <div className="about-rise border border-dashed border-lp-primary/50 bg-lp-accent/40 p-5" style={rise(0)}>
        <div className="flex items-center gap-3">
          <FileBox className="size-8 shrink-0 text-lp-primary" strokeWidth={1.25} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">bracket_v3.step</div>
            <div className="mt-2 h-1 bg-lp-border">
              <div className="about-progress h-full bg-lp-primary" />
            </div>
          </div>
        </div>
      </div>
      <div className="about-rise lp-label-mono mt-4 flex items-center gap-2 text-lp-primary" style={rise(4)}>
        <Lock className="size-3.5" />
        NDA Protected
      </div>
    </div>
  );
}

function QuoteScreen() {
  return (
    <div className="text-sm">
      {QUOTE_OPTIONS.map(([label, value], i) => (
        <div
          key={label}
          className="about-rise flex justify-between border-b border-dashed border-lp-border py-2.5"
          style={rise(i)}
        >
          <span className="text-lp-muted-fg">{label}</span>
          <span>{value}</span>
        </div>
      ))}
      <div className="about-rise mt-4 flex items-center gap-2 font-medium text-lp-primary" style={rise(5)}>
        <Check className="size-4" />
        Quote ready
      </div>
    </div>
  );
}

function ProductionScreen() {
  return (
    <ol className="space-y-3 text-sm">
      {ORDER_STAGES.map((stage, i) => (
        <li key={stage} className="about-rise flex items-center gap-3" style={rise(i * 2)}>
          <span className="flex size-6 items-center justify-center rounded-full bg-lp-primary text-lp-primary-fg">
            <Check className="size-3.5" />
          </span>
          {stage}
        </li>
      ))}
    </ol>
  );
}

function DeliveryScreen() {
  return (
    <div>
      <div className="relative mt-3 h-10 border-b border-dashed border-lp-primary/50">
        <Truck className="about-truck absolute bottom-1 size-7 text-lp-primary" strokeWidth={1.25} />
      </div>
      <div className="lp-label-mono mt-2 flex justify-between text-lp-muted-fg">
        <span>MechMaster</span>
        <span>Your door</span>
      </div>
      <div className="about-rise mt-6 text-5xl tracking-tight" style={rise(6)}>
        72<span className="font-lp-serif italic text-lp-primary">hr</span>
      </div>
      <div className="about-rise lp-label-mono mt-1 text-lp-muted-fg" style={rise(7)}>
        Average turnaround
      </div>
    </div>
  );
}

const SCREENS = [UploadScreen, QuoteScreen, ProductionScreen, DeliveryScreen];

/** Blueprint-blue frame around a mock order screen. */
function StepScreen({ index, on, className }: { index: number; on?: boolean; className?: string }) {
  const Screen = SCREENS[index]!;
  return (
    <div className={cn('lp-grid-bg bg-lp-primary p-4 sm:p-8', className)} data-on={on} aria-hidden="true">
      <div className="bg-lp-bg text-lp-fg">
        <div className="lp-label-mono flex items-center justify-between border-b border-lp-border px-5 py-3 text-lp-muted-fg">
          <span>Your Order</span>
          <span>
            0{index + 1} / 0{STEPS.length}
          </span>
        </div>
        <div className="p-5 sm:p-6">
          <Screen />
        </div>
      </div>
    </div>
  );
}

function StepText({ index, children }: { index: number; children?: ReactNode }) {
  const step = STEPS[index]!;
  return (
    <>
      <span className="font-lp-serif text-6xl italic leading-none text-lp-primary">0{index + 1}</span>
      <h3 className="mt-4 text-3xl tracking-tight md:text-4xl">{step.title}</h3>
      <p className="mt-3 max-w-md text-lp-muted-fg">{step.body}</p>
      {children}
    </>
  );
}

/** Scroll-driven walkthrough. Desktop pins the mock screen; phones show one under each step. */
export function AboutJourney() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(stepRefs.current.indexOf(entry.target as HTMLLIElement));
        }
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="mx-auto max-w-[1400px] scroll-mt-20 px-4 py-24 sm:px-5 md:py-32">
      <div className="text-center">
        <Reveal>
          <Tag>How It Works</Tag>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
            Four Steps to <span className="lp-accent-serif">Real Parts</span>
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mt-5 max-w-md text-lp-muted-fg">
            From design file to delivered part, in days, not weeks.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-16 lg:mt-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="relative lg:pl-10">
          <div className="absolute bottom-[22vh] left-0 top-[22vh] hidden w-px bg-lp-border lg:block">
            <div
              className="h-full origin-top bg-lp-primary transition-transform duration-700"
              style={{ transform: `scaleY(${(active + 1) / STEPS.length})` }}
            />
          </div>
          <ol className="space-y-16 lg:space-y-0">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                ref={(el) => {
                  stepRefs.current[i] = el;
                }}
                className={cn(
                  'transition-opacity duration-500 lg:flex lg:min-h-[66vh] lg:flex-col lg:justify-center',
                  active !== i && 'lg:opacity-30'
                )}
              >
                <Reveal>
                  <StepText index={i} />
                </Reveal>
                <Reveal delay={100} className="mt-6 lg:hidden">
                  <StepScreen index={i} />
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <div className="sticky top-28 hidden h-[calc(100vh-9rem)] items-center lg:flex">
          <div className="relative h-[26rem] w-full">
            {STEPS.map((step, i) => (
              <StepScreen
                key={step.title}
                index={i}
                on={active === i}
                className={cn(
                  'absolute inset-0 flex flex-col justify-center transition-all duration-500',
                  active === i ? 'opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
