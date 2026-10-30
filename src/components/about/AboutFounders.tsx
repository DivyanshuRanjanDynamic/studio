import Image from 'next/image';
import { Mail, MapPin } from 'lucide-react';
import { Reveal, Tag } from '@/components/home/primitives';

// To swap a founder's picture, change `photo` here. `focus` and `zoom` frame the face
// inside the 4:5 crop, so adjust them too if the new picture is composed differently.
const FOUNDERS = [
  {
    name: 'Divyanshu Ranjan',
    role: 'Co-founder & CTO',
    photo: '/about/founders/divyanshu-ranjan.jpg',
    focus: '50% 40%',
    zoom: 1,
  },
  {
    name: 'Ujjwal Jha',
    role: 'CEO',
    photo: '/about/founders/ujjwal-jha.webp',
    focus: '47% 20%',
    zoom: 2,
  },
  {
    name: 'Dristi Sengupta',
    role: 'Co-founder & COO',
    photo: '/about/founders/dristi-sengupta.webp',
    focus: '50% 30%',
    zoom: 1.2,
  },
];

function Portrait({ founder, delay }: { founder: (typeof FOUNDERS)[number]; delay: number }) {
  const { name, photo, focus, zoom } = founder;
  // Zoomed photos render wider than their card, so ask for a matching source size.
  const sizes = `(min-width: 1400px) ${Math.round(440 * zoom)}px, (min-width: 768px) ${Math.round(33 * zoom)}vw, ${Math.round(100 * zoom)}vw`;
  const image = (alt: string) => (
    <Image
      src={photo}
      alt={alt}
      fill
      sizes={sizes}
      className="about-portrait-img object-cover"
      style={{ objectPosition: focus, transformOrigin: focus }}
    />
  );

  return (
    <div
      className="about-portrait"
      style={{ '--zoom': zoom, '--delay': `${delay + 250}ms` } as React.CSSProperties}
    >
      <div className="about-portrait-tint">{image('')}</div>
      <div className="about-portrait-colour">{image(`Portrait of ${name}`)}</div>
      <div className="about-portrait-scan" />
      <span className="about-portrait-mark left-3 top-3 border-l border-t" />
      <span className="about-portrait-mark right-3 top-3 border-r border-t" />
      <span className="about-portrait-mark bottom-3 left-3 border-b border-l" />
      <span className="about-portrait-mark bottom-3 right-3 border-b border-r" />
    </div>
  );
}

export function AboutFounders() {
  return (
    <section id="founders" className="lp-hero-dots scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
        <div className="text-center">
          <Reveal>
            <Tag>The Founders</Tag>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
              The People <span className="lp-accent-serif">Building</span> MechHub
            </h2>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {FOUNDERS.map((founder, i) => (
            <Reveal key={founder.name} delay={i * 120} className={i === 1 ? 'md:mt-12' : ''}>
              <article className="group border border-lp-border bg-lp-card p-3 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1.5 hover:border-lp-primary hover:shadow-[0_20px_60px_-20px_oklch(var(--lp-primary))]">
                <Portrait founder={founder} delay={i * 120} />
                <div className="flex items-start justify-between gap-4 px-2 pb-2 pt-5">
                  <div>
                    <h3 className="text-2xl tracking-tight lg:text-3xl">{founder.name}</h3>
                    <p className="lp-label-mono mt-2 text-lp-primary">{founder.role}</p>
                  </div>
                  <span className="lp-label-mono shrink-0 pt-2 text-lp-muted-fg">
                    0{i + 1} / 0{FOUNDERS.length}
                  </span>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14 flex flex-wrap justify-center gap-3">
          <a
            href="mailto:outreach@mechhub.in"
            className="flex items-center gap-3 border border-lp-border bg-lp-bg px-5 py-3 text-sm transition-colors hover:border-lp-primary"
          >
            <Mail className="size-4 text-lp-primary" />
            outreach@mechhub.in
          </a>
          <div className="flex items-center gap-3 border border-lp-border bg-lp-bg px-5 py-3 text-sm">
            <MapPin className="size-4 text-lp-primary" />
            Atal Incubation Centre - Raise , Coimbatore, Tamil Nadu, India
          </div>
        </Reveal>
      </div>
    </section>
  );
}
