import { Star } from 'lucide-react';
import { Reveal, Tag } from './primitives';

// TODO: Replace placeholder quotes with real customer quotes
const TESTIMONIALS = [
  {
    tag: 'Robotics · Prototype',
    quote:
      'MechHub helped us manufacture custom aluminium chassis parts for our robotics prototype within days. The quality, precision and support were way better than what we found locally — and at a student-friendly cost.',
    name: 'A.R.',
    role: 'Robotics Team, IIT',
  },
  {
    tag: 'Drone · CNC Parts',
    quote:
      'We needed lightweight, high-precision parts for our drone frame. MechHub delivered exactly what we needed — great quality, fast turnaround and super helpful support throughout the process.',
    name: 'V.K.',
    role: 'Founder, Student Startup',
  },
  {
    tag: 'EV · Production',
    quote:
      'From CAD to finished parts, MechHub made the entire process seamless. We ordered custom brackets and housings for our EV prototype and the fit and finish were excellent. Highly recommended for any hardware team.',
    name: 'S.P.',
    role: 'Design Team, EV Startup',
  },
];

// TODO: Update "500+ builders" count with real number
const METRICS = [
  ['500+', 'Builders on MechHub'],
  ['72hr', 'Avg. Turnaround'],
  ['150+', 'Active Projects'],
  ['100%', 'NDA Protected'],
];

// TODO: Replace with real university/company logos
const TRUSTED_TEAMS = ['IIT Bombay', 'NIT Trichy', 'BITS Pilani', 'Startup Teams'];

const BANNER_WORDS = [
  'Custom Manufacturing',
  'For a Brighter Tomorrow',
  'Design',
  'Iterate',
  'Manufacture',
  'Build',
  'Real Ideas, Real Impact',
  'Ideas Into Real Parts',
  'Precision for Progress',
  'More Builders, Bigger Possibilities',
];

/** Oversized blue word ticker that leads into the testimonials. */
export function WordsBanner() {
  return (
    <div className="overflow-hidden bg-lp-primary py-10 text-lp-primary-fg" aria-hidden="true">
      <div
        className="lp-marquee flex w-max gap-12 whitespace-nowrap text-6xl leading-none tracking-tight md:text-8xl"
        style={{ animationDuration: '60s' }}
      >
        {[...BANNER_WORDS, ...BANNER_WORDS].map((word, i) => (
          <span key={i} className={i % 2 ? 'font-lp-serif italic' : ''}>
            {word} ✱
          </span>
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-28 sm:px-5">
      <div className="text-center">
        <Reveal>
          <Tag>Testimonials</Tag>
        </Reveal>
        <Reveal delay={100}>
          <h2 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
            Built by Builders. <span className="lp-accent-serif">Trusted</span> by Teams.
          </h2>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mt-5 max-w-md text-lp-muted-fg">
            From student prototypes to production-ready parts — see why teams choose MechHub.
          </p>
        </Reveal>
      </div>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t, i) => (
          <Reveal
            key={t.name}
            delay={i * 100}
            className="group flex flex-col justify-between border border-lp-border bg-lp-card p-7 hover:-translate-y-2 hover:border-lp-primary"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="lp-tag">{t.tag}</span>
                <span className="flex text-lp-primary" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="size-3 fill-current" />
                  ))}
                </span>
              </div>
              <p className="mt-6 text-base leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
            </div>
            <div className="mt-8 flex items-center gap-3 border-t border-lp-border pt-5">
              <span className="flex size-10 items-center justify-center rounded-full bg-lp-primary text-sm text-lp-primary-fg">
                {t.name.replace(/\./g, '')}
              </span>
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-lp-muted-fg">{t.role}</div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-14 grid grid-cols-2 gap-px bg-lp-border md:grid-cols-4">
        {METRICS.map(([value, label], i) => (
          <Reveal key={label} delay={i * 80} className="bg-lp-bg p-6">
            <div className="text-4xl tracking-tight text-lp-primary md:text-6xl">{value}</div>
            <div className="lp-label-mono mt-2 text-lp-muted-fg">{label}</div>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="lp-label-mono text-lp-muted-fg">Trusted by Students, Startups and Innovation Teams</p>
        <div className="mt-5 flex flex-wrap justify-center gap-x-12 gap-y-3 text-2xl text-lp-muted-fg">
          {TRUSTED_TEAMS.map((team) => (
            <span key={team} className="font-lp-serif italic transition-colors hover:text-lp-primary">
              {team}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
