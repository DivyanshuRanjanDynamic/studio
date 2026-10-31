import Image from 'next/image';
import { CtaButton } from './primitives';

const HEADLINE = [['Custom', 'Manufacturing'], ['Made', 'Fast', '&'], ['Affordable']];
const ACCENT_WORD = 'Manufacturing';

const PARTS = ['/home/part-1.png', '/home/part-2.png', '/home/part-3.png', '/home/part-4.png', '/home/part-5.png'];
const PART_SIZES: Record<string, [number, number]> = {
  '/home/part-1.png': [408, 640],
  '/home/part-2.png': [323, 640],
  '/home/part-3.png': [259, 640],
  '/home/part-4.png': [399, 640],
  '/home/part-5.png': [290, 640],
};
// Four copies so each half of the -50% marquee loop is wider than a 1920px screen.
// Copies reuse the same URLs, so the browser still downloads only five images.
const PART_STRIP = [...PARTS, ...PARTS, ...PARTS, ...PARTS];


// this part should be curved from the middle ,overall these parts moves but in curve line not straught line 

export function Hero() {
  return (
    <section className="lp-hero-dots relative flex min-h-[100svh] max-h-[1100px] flex-col overflow-hidden pt-28">
      <div className="mx-auto max-w-[1400px] px-4 text-center sm:px-5">
        <h1 className="mx-auto max-w-4xl text-[2.6rem] font-normal leading-[1.02] tracking-tight sm:text-[3rem] md:text-[5.5rem]">
          {HEADLINE.map((line, li) => (
            <span key={li} className="block">
              {line.map((word, wi) => (
                <span
                  key={wi}
                  className={`lp-hero-word ${word === ACCENT_WORD ? 'lp-accent-serif' : ''}`}
                  style={{ animationDelay: `${300 + (li * 4 + wi) * 90}ms` }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </span>
          ))}
        </h1>
      </div>

      {/* Rotating strip of machined parts */}
      <div className="relative mt-6 flex flex-1 items-center overflow-hidden">
        <div className="lp-marquee flex w-max items-center gap-16 py-10" style={{ animationDuration: '45s' }}>
          {PART_STRIP.map((src, i) => {
            const [w, h] = PART_SIZES[src];
            return (
              <div
                key={i}
                className="lp-hero-part"
                aria-hidden={i >= PARTS.length || undefined}
                style={{ animationDelay: `${1100 + (i % 5) * 140}ms` }}
              >
                <Image
                  src={src}
                  alt={i < PARTS.length ? 'Precision CNC part' : ''}
                  width={w}
                  height={h}
                  priority={i < 5}
                  sizes="(min-width: 768px) 160px, 120px"
                  className="h-44 w-auto max-w-none object-contain drop-shadow-[0_30px_30px_rgba(0,0,40,0.18)] transition-transform duration-700 hover:-rotate-6 hover:scale-110 md:h-60"
                  style={{ animation: `lp-floaty ${5 + (i % 3)}s ease-in-out ${i * 0.4}s infinite` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1400px] items-end gap-6 px-4 pb-8 sm:px-5 md:grid-cols-3">
        <p className="lp-hero-fade lp-label-mono order-2 md:order-1" style={{ animationDelay: '1600ms' }}>
          Built in India for builders{' '}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/home/flag-in.svg" alt="India" className="inline h-2.5" />
          <br />
          72hr typical turnaround
        </p>

        <div className="lp-hero-fade order-1 text-center md:order-2" style={{ animationDelay: '1400ms' }}>
          <p className="mx-auto max-w-xs text-sm text-lp-muted-fg">
            Upload a design and get precision engineered parts delivered with transparency. Built for startups,
            college clubs, industrial buyers, and businesses.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <CtaButton>Upload Your Design</CtaButton>
            <CtaButton href="/onboard" ghost>
              Become a MechMaster
            </CtaButton>
          </div>
        </div>

        <p className="lp-hero-fade lp-label-mono order-3 md:text-right" style={{ animationDelay: '1600ms' }}>
          500+ orders
          <br />
          delivered with transparency
        </p>
      </div>
    </section>
  );
}
