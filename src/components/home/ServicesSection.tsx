import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal, Tag } from './primitives';

const SERVICES = [
  {
    name: 'Precision Sheet Cutting',
    category: 'Sheet Metal',
    image: '/home/svc-1.jpg',
    description: 'Laser & waterjet cutting with 2D designs from flat sheet stock with minimal accuracy.',
    tags: ['High Precision', 'Smooth Edges', 'Custom Shapes'],
    href: '/services/precision-sheet-cutting',
  },
  {
    name: 'CNC Milling / Turning',
    category: 'CNC Machining',
    image: '/home/svc-2.jpg',
    description: 'Remove material from a solid block to create complex 3D geometry with high tolerances.',
    tags: ['Tight Tolerances', 'Complex Geometries', 'High Finish'],
    href: '/services/cnc-machining',
  },
  {
    name: 'Bending & Folding',
    category: 'Bending & Folding',
    image: '/home/svc-3.jpg',
    description: 'Precisely fold sheet metal along defined lines to produce structural angles & enclosures.',
    tags: ['Accurate Angles', 'Multiple Thicknesses', 'Large Panels'],
    href: '/services/bending',
  },
  {
    name: 'Countersinking',
    category: 'Reduced Tolerance',
    image: '/home/svc-4.jpg',
    description: 'Create tapered holes to sit flush with fasteners for a clean and professional finish.',
    tags: ['Flush Fit', 'Better Aesthetics', 'Secure Assembly'],
    href: '/services/countersinking',
  },
  {
    name: 'Dimple Forming',
    category: 'Custom Fabrication',
    image: '/home/svc-5.jpg',
    description: 'Form reinforced dimples to increase strength and reduce vibration in sheet metal parts.',
    tags: ['Stronger Parts', 'Vibration Resistant', 'Lightweight'],
    href: '/services/dimple-forming',
  },
  {
    name: 'Hardware Insertion',
    category: 'Hardware',
    image: '/home/svc-6.jpg',
    description: 'Press-fit threaded inserts, standoffs, and PEM fasteners for durable and reliable assemblies.',
    tags: ['Strong Hold', 'Repeatable Process', 'Wide Range'],
    href: '/services/hardware-insertion',
  },
  {
    name: 'Precision Tapping',
    category: 'Threading',
    image: '/home/svc-7.jpg',
    description: 'Create internal threads with high accuracy for secure, long-lasting connections.',
    tags: ['Metric / Imperial', 'High Accuracy', 'Clean Finish'],
    href: '/services/tapping',
  },
  {
    name: 'Anodizing',
    category: 'Surface Finishing',
    image: '/home/svc-8.jpg',
    description: 'Enhance corrosion resistance and aesthetics with durable, high-quality anodized coatings.',
    tags: ['Corrosion Resistant', 'Multiple Colors', 'Long Life'],
    href: '/services/anodizing',
  },
  {
    name: 'Powder Coating',
    category: 'Finishing',
    image: '/home/svc-9.jpg',
    description: 'Electrostatic coating for a durable, impact-resistant, and visually appealing finish.',
    tags: ['Durable Finish', 'Scratch Resistant', 'Multiple Colors'],
    href: '/services/powder-coating',
  },
];

export function ServicesSection({ headingAs: Heading = 'h2' }: { headingAs?: 'h1' | 'h2' }) {
  return (
    <section id="services" className="scroll-mt-16 bg-lp-muted/60 py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
        <div className="text-center">
          <Reveal>
            <Tag>Our Capabilities</Tag>
          </Reveal>
          <Reveal delay={100}>
            <Heading className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
              Everything You <span className="lp-accent-serif">Need</span> to Build
            </Heading>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mt-5 max-w-lg text-lp-muted-fg">
              Nine precision manufacturing capabilities. One automated platform. Delivered straight to your
              production line.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-px bg-lp-border md:grid-cols-3">
          {SERVICES.map((service, i) => (
            <Reveal
              key={service.name}
              delay={(i % 3) * 90}
              className="group relative bg-lp-card p-6 hover:bg-lp-primary hover:text-lp-primary-fg"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{service.name}</span>
                <ArrowRight className="size-4 transition-transform group-hover:-rotate-45" />
              </div>
              <dl className="mt-3 grid grid-cols-[90px_1fr] gap-y-1 text-xs">
                <dt className="opacity-60">Category:</dt>
                <dd>{service.category}</dd>
                <dt className="opacity-60">Index:</dt>
                <dd>0{i + 1}</dd>
              </dl>
              <div className="relative my-6 h-52 overflow-hidden rounded-sm">
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-[1.2s] group-hover:scale-110"
                />
                <span className="lp-tag absolute bottom-2 left-2 translate-y-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  0{i + 1} / 09
                </span>
              </div>
              <p className="text-sm opacity-75">{service.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    className="lp-label-mono border border-[color-mix(in_oklab,currentColor_30%,transparent)] px-2 py-0.5 opacity-80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link
                href={service.href}
                className="lp-label-mono mt-5 inline-block underline-offset-4 hover:underline"
              >
                Learn more →
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="lp-grid-bg relative mt-10 overflow-hidden rounded-sm bg-lp-primary p-10 text-center text-lp-primary-fg">
          <h4 className="text-3xl md:text-4xl">Don&apos;t see what you need?</h4>
          <p className="mx-auto mt-3 max-w-md text-sm opacity-85">
            Our engineering team can spec, quote, and manufacture custom parts across 50+ alloys &amp; polymers.
          </p>
          <Link
            href="/contact"
            className="lp-label-mono mt-6 inline-flex items-center gap-2 rounded-sm bg-lp-bg px-5 py-3 text-lp-fg transition-transform hover:scale-105"
          >
            → Book Free Engineering Consultation
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
