import { Reveal, Tag } from '@/components/home/primitives';
import { SERVICES } from '@/components/home/ServicesSection';
import { ServiceIndex } from './ServiceIndex';

const DIGITS = Array.from({ length: 10 }, (_, digit) => digit);

const NUMBERS = [
  { value: '72', suffix: 'hr', label: 'Average turnaround' },
  { value: '9', label: 'Manufacturing capabilities' },
  { value: '0', label: 'Minimum order quantity' },
  { value: '1', label: 'Platform for the whole order' },
];

/** Number that rolls up to its value when its parent Reveal enters the viewport. */
function RollingNumber({ value }: { value: string }) {
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true">
        {[...value].map((digit, i) => (
          <span key={i} className="about-odo">
            <span style={{ '--digit': digit, '--delay': `${i * 120}ms` } as React.CSSProperties}>
              {DIGITS.map((d) => (
                <i key={d}>{d}</i>
              ))}
            </span>
          </span>
        ))}
      </span>
    </>
  );
}

export function AboutServices() {
  return (
    <section className="bg-lp-muted/60 py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
        <Reveal>
          <Tag>What We Offer</Tag>
        </Reveal>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <Reveal delay={100}>
            <h2 className="text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
              Nine Capabilities, <span className="lp-accent-serif whitespace-nowrap">One Order</span>
            </h2>
          </Reveal>
          <Reveal delay={150} className="lg:self-end">
            <p className="max-w-md text-lp-muted-fg lg:ml-auto">
              Cut it, machine it, bend it and finish it, all under one roof. One order, one delivery, zero overhead.
            </p>
          </Reveal>
        </div>

        <ServiceIndex
          services={SERVICES.map(({ name, category, image, href }) => ({ name, category, image, href }))}
        />
      </div>
    </section>
  );
}
