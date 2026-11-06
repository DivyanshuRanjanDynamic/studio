import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { Accent, Reveal, SectionHeader } from './primitives';
import { buttonClass } from './button';

export const SERVICES = [
  {
    name: 'Precision sheet cutting',
    category: 'Sheet metal',
    image: '/home/svc-1.jpg',
    description: 'Laser and waterjet cutting of 2D profiles from flat sheet stock, with clean edges and tight tolerances.',
    tags: ['High precision', 'Smooth edges', 'Custom shapes'],
    href: '/services/precision-sheet-cutting',
  },
  {
    name: 'CNC milling and turning',
    category: 'CNC machining',
    image: '/home/svc-2.jpg',
    description: 'Complex 3D geometry machined from a solid block, held to tight tolerances.',
    tags: ['Tight tolerances', 'Complex geometry', 'Fine finish'],
    href: '/services/cnc-machining',
  },
  {
    name: 'Bending and folding',
    category: 'Sheet metal',
    image: '/home/svc-3.jpg',
    description: 'Sheet metal folded along defined lines into brackets, angles and enclosures.',
    tags: ['Accurate angles', 'Many thicknesses', 'Large panels'],
    href: '/services/bending',
  },
  {
    name: 'Countersinking',
    category: 'Hole features',
    image: '/home/svc-4.jpg',
    description: 'Tapered holes so screw heads sit flush for a clean, professional finish.',
    tags: ['Flush fit', 'Clean look', 'Secure assembly'],
    href: '/services/countersinking',
  },
  {
    name: 'Dimple forming',
    category: 'Forming',
    image: '/home/svc-5.jpg',
    description: 'Formed dimples that stiffen sheet metal parts and cut vibration without adding weight.',
    tags: ['Stronger parts', 'Less vibration', 'Lightweight'],
    href: '/services/dimple-forming',
  },
  {
    name: 'Hardware insertion',
    category: 'Hardware',
    image: '/home/svc-6.jpg',
    description: 'Threaded inserts, standoffs and PEM fasteners pressed in for durable assemblies.',
    tags: ['Strong hold', 'Repeatable', 'Wide range'],
    href: '/services/hardware-insertion',
  },
  {
    name: 'Precision tapping',
    category: 'Threading',
    image: '/home/svc-7.jpg',
    description: 'Accurate internal threads for secure connections that last.',
    tags: ['Metric and imperial', 'High accuracy', 'Clean finish'],
    href: '/services/tapping',
  },
  {
    name: 'Anodizing',
    category: 'Surface finishing',
    image: '/home/svc-8.jpg',
    description: 'A hard anodized layer that resists corrosion and comes in several colours.',
    tags: ['Corrosion resistant', 'Several colours', 'Long life'],
    href: '/services/anodizing',
  },
  {
    name: 'Powder coating',
    category: 'Surface finishing',
    image: '/home/svc-9.jpg',
    description: 'An electrostatic coating that stands up to knocks and scratches and looks good doing it.',
    tags: ['Durable finish', 'Scratch resistant', 'Several colours'],
    href: '/services/powder-coating',
  },
];

export function ServicesSection({ headingAs = 'h2' }: { headingAs?: 'h1' | 'h2' }) {
  const isPage = headingAs === 'h1';
  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className={`scroll-mt-24 px-4 ${isPage ? 'pb-16 pt-8 md:pb-24 md:pt-16' : 'py-16 md:py-24'}`}
    >
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          as={headingAs}
          id="services-heading"
          kicker="Capabilities"
          title={<>Nine processes, <Accent>one order</Accent></>}
          lead="Cut, machine, form, thread and finish your parts through one platform. Pick a process to see materials, tolerances and design tips."
        />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal as="li" key={service.name} delay={(i % 3) * 80}>
              <Link
                href={service.href}
                className="lp-press group flex h-full flex-col rounded-2xl border border-lp-border bg-lp-card p-1 hover:border-lp-primary/40 hover:bg-lp-bg"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src={service.image}
                    alt={`${service.name} at MechHub`}
                    fill
                    sizes="(min-width: 1200px) 392px, (min-width: 1024px) 32vw, (min-width: 640px) 48vw, 100vw"
                    className="object-cover transition-transform duration-500 ease-lp group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="caption-4 text-lp-muted-fg">{service.category}</span>
                  <h3 className="title-2 mt-1 flex items-center justify-between gap-2">
                    {service.name}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-lp-primary transition-transform duration-300 ease-lp group-hover:translate-x-1"
                      weight="bold"
                    />
                  </h3>
                  <p className="body-6 mt-2 text-lp-muted-fg">{service.description}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>

        <Reveal className="mt-8 flex flex-col items-start justify-between gap-6 rounded-2xl bg-lp-ink p-6 text-lp-ink-fg md:flex-row md:items-center md:p-8">
          <div>
            <h3 className="heading-5">Need a process that is not listed?</h3>
            <p className="body-6 mt-2 max-w-[560px] text-lp-ink-fg/70">
              Our engineers can spec, quote and source custom work across the full materials catalogue.
            </p>
          </div>
          <Link href="/contact" className={buttonClass('inverted')}>
            Talk to an engineer
            <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
