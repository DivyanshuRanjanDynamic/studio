import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr';
import { Accent, Reveal, Tag, UploadLink } from './primitives';

// Example parts with specs MechHub actually offers (CNC materials and ± 0.025 mm from
// the quote engine's CNC rate card). Not order history, so no counts or "best sellers".
const PARTS = [
  {
    name: 'Mounting plate',
    image: '/home/part-1.png',
    w: 408,
    specs: [
      ['Material', 'Aluminium 6061'],
      ['Process', 'CNC milling'],
      ['Tolerance', '± 0.025 mm'],
      ['Finish', 'Anodizing'],
    ],
    href: '/services/cnc-machining',
  },
  {
    name: 'Shaft coupling',
    image: '/home/part-2.png',
    w: 323,
    specs: [
      ['Material', 'Aluminium 6061'],
      ['Process', 'CNC turning'],
      ['Tolerance', '± 0.025 mm'],
      ['Finish', 'Anodizing'],
    ],
    href: '/services/cnc-machining',
  },
  {
    name: 'Stepped shaft',
    image: '/home/part-3.png',
    w: 259,
    specs: [
      ['Material', 'EN8 steel'],
      ['Process', 'CNC turning'],
      ['Tolerance', '± 0.025 mm'],
      ['Finish', 'Powder coating'],
    ],
    href: '/services/cnc-machining',
  },
  {
    name: 'End cap',
    image: '/home/part-4.png',
    w: 399,
    specs: [
      ['Material', 'Aluminium 6061'],
      ['Process', 'CNC turning'],
      ['Tolerance', '± 0.025 mm'],
      ['Finish', 'Anodizing'],
    ],
    href: '/services/anodizing',
  },
  {
    name: 'Clevis bracket',
    image: '/home/part-5.png',
    w: 290,
    specs: [
      ['Material', 'Stainless steel 304'],
      ['Process', 'CNC milling'],
      ['Tolerance', '± 0.025 mm'],
      ['Finish', 'As machined'],
    ],
    href: '/services/cnc-machining',
  },
];

/** Wireframe box for the upload card (drawn, so it stays crisp on the blueprint grid). */
function WireBox() {
  return (
    <svg viewBox="0 0 160 140" aria-hidden="true" className="h-auto w-40 md:w-48" fill="none" stroke="currentColor" strokeWidth="1.25">
      <path d="M80 10 150 45v60l-70 35-70-35V45z" />
      <path d="M10 45l70 35 70-35M80 80v60" />
      <path d="M30 55l50 25 50-25M30 55v40l50 25 50-25V55" strokeOpacity=".5" />
      <circle cx="80" cy="62" r="9" strokeOpacity=".7" />
    </svg>
  );
}

/** Spec sheet grid of example parts, ending in a blue drag and drop card. */
export function PartsCatalogue() {
  return (
    <section id="parts" aria-labelledby="parts-heading" className="scroll-mt-24 bg-lp-muted px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <Reveal className="mx-auto max-w-[680px] text-center">
          <Tag>Manufacture</Tag>
          <h2 id="parts-heading" className="heading-2 mt-4">
            Parts we machine <br />
            <Accent>to your drawing</Accent>
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-lp-border bg-lp-border sm:grid-cols-2 lg:grid-cols-3">
          {PARTS.map((part, i) => (
            <Reveal as="li" key={part.name} delay={(i % 3) * 80} className="bg-lp-bg">
              <Link
                href={part.href}
                className="group flex h-full flex-col p-6 transition-colors duration-300 ease-lp hover:bg-lp-card"
              >
                <div className="flex items-center justify-between">
                  <h3 className="title-2">{part.name}</h3>
                  <span className="flex size-8 items-center justify-center rounded-full border border-lp-border transition-colors duration-300 ease-lp group-hover:border-lp-primary group-hover:bg-lp-primary group-hover:text-lp-primary-fg">
                    <ArrowUpRight aria-hidden="true" className="size-4" weight="bold" />
                  </span>
                </div>
                <dl className="mt-4 grid grid-cols-[96px_1fr] gap-y-1">
                  {part.specs.map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="lp-mono text-lp-muted-fg">{k}</dt>
                      <dd className="lp-mono">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="flex flex-1 items-center justify-center pt-8">
                  <Image
                    src={part.image}
                    alt={`${part.name} in ${part.specs[0][1]}`}
                    width={part.w}
                    height={640}
                    sizes="128px"
                    className="h-40 w-auto object-contain transition-transform duration-500 ease-lp group-hover:-rotate-6 group-hover:scale-105 md:h-48"
                  />
                </div>
              </Link>
            </Reveal>
          ))}

          <Reveal as="li" delay={160}>
            <UploadLink className="lp-blueprint lp-marks group flex h-full min-h-[320px] flex-col items-center justify-between gap-6 p-6 text-center text-lp-primary-fg">
              <span className="heading-5 mt-4">
                Drag and drop
                <br />
                your CAD file
              </span>
              <span className="transition-transform duration-500 ease-lp group-hover:-translate-y-1">
                <WireBox />
              </span>
              <span>
                <span className="lp-mono block opacity-70">Supported format</span>
                <span className="lp-mono mt-1 block">.STEP</span>
              </span>
            </UploadLink>
          </Reveal>
        </ul>
      </div>
    </section>
  );
}
