import { Check, X } from '@phosphor-icons/react/dist/ssr';
import { Accent, Reveal, SectionHeader } from './primitives';

const OLD_WAY = [
  'Email ten workshops, wait three days, get ten different answers',
  'No idea whether your part is being made or sitting in a queue',
  'Minimum order quantities that price out students and small teams',
  'Your CAD files passed around with no NDA in place',
  'One vendor for cutting, another for bending, a third for finishing',
];

const MECHHUB_WAY = [
  ['Upload once, get one quote.', 'Instant for standard parts, fast for everything else.'],
  ['Track every stage.', 'From quote approval to production, QC and dispatch.'],
  ['Order one part or a thousand.', 'No minimum quantity.'],
  ['NDA before anyone sees your file.', 'Designs are kept in encrypted storage.'],
  ['One partner network for every process.', 'One order, one delivery.'],
];

/** Problem to solution: the old way of sourcing custom parts against MechHub. */
export function WhyMechHub() {
  return (
    <section aria-labelledby="why-heading" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          id="why-heading"
          kicker="Why MechHub"
          title={<>Getting one part made should not take <Accent>ten emails</Accent></>}
          lead="Sourcing custom parts in India still means phone calls, follow ups and guesswork. MechHub replaces all of it with one upload."
        />

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <Reveal className="rounded-2xl border border-lp-border bg-lp-card p-6 md:p-8">
            <h3 className="title-2 text-lp-muted-fg">The usual way</h3>
            <ul className="mt-6 space-y-4">
              {OLD_WAY.map((item) => (
                <li key={item} className="body-6 flex gap-3 text-lp-muted-fg">
                  <X aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-lp-destructive" weight="bold" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100} className="rounded-2xl bg-lp-primary p-6 text-lp-primary-fg md:p-8">
            <h3 className="title-2">With MechHub</h3>
            <ul className="mt-6 space-y-4">
              {MECHHUB_WAY.map(([bold, rest]) => (
                <li key={bold} className="body-6 flex gap-3">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" weight="bold" />
                  <span>
                    <span className="body-4">{bold}</span> <span className="opacity-80">{rest}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
