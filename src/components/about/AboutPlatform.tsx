import { ArrowRight, Factory, PencilRuler, Stack } from '@phosphor-icons/react/dist/ssr';
import { Reveal, SectionHeader } from '@/components/home/primitives';
import { cn } from '@/utils';

const SIDES = [
  {
    icon: PencilRuler,
    who: 'You',
    title: 'Builders',
    body: 'Students, startups and hobbyists upload a design, approve a quote and track the order. One part or a thousand, with no minimum quantity.',
    highlight: false,
  },
  {
    icon: Stack,
    who: 'In the middle',
    title: 'MechHub',
    body: 'Instant quotes, NDA protected design files, live order tracking and QC inspection, all in one managed flow.',
    highlight: true,
  },
  {
    icon: Factory,
    who: 'The network',
    title: 'MechMasters',
    body: 'Vetted manufacturing partners take on the work, from sheet cutting and CNC machining to surface finishing.',
    highlight: false,
  },
];

/** How the managed marketplace fits together: builders, MechHub, MechMasters. */
export function AboutPlatform() {
  return (
    <section aria-labelledby="platform-heading" className="bg-lp-ink px-4 py-16 text-lp-ink-fg md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          inverted
          id="platform-heading"
          kicker="The platform"
          title="A managed marketplace, not a vendor list"
          lead="You deal with one platform and one price. MechHub runs the network behind it, so cutting, bending and finishing never become your project to manage."
        />

        <ol className="mt-12 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {SIDES.map(({ icon: Icon, who, title, body, highlight }, i) => (
            <li key={title} className="contents">
              {i > 0 && (
                <span aria-hidden="true" className="hidden items-center justify-center text-lp-ink-fg/40 lg:flex">
                  <ArrowRight className="size-5" weight="bold" />
                </span>
              )}
              <Reveal
                as="article"
                delay={i * 80}
                className={cn(
                  'rounded-2xl p-6',
                  highlight ? 'bg-lp-primary text-lp-primary-fg' : 'border border-lp-ink-fg/15'
                )}
              >
                <Icon aria-hidden="true" className="size-6" weight="duotone" />
                <p className={cn('caption-4 mt-6', highlight ? 'text-lp-primary-fg/80' : 'text-lp-ink-fg/60')}>{who}</p>
                <h3 className="heading-6 mt-1">{title}</h3>
                <p className={cn('body-6 mt-2', highlight ? 'text-lp-primary-fg/80' : 'text-lp-ink-fg/70')}>{body}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
