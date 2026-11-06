import Image from 'next/image';
import { EnvelopeSimple, MapPin } from '@phosphor-icons/react/dist/ssr';
import { Reveal, SectionHeader } from '@/components/home/primitives';

// To swap a founder's picture, change `photo` here. `focus` and `zoom` frame the face
// inside the 4:5 crop, so adjust them too if the new picture is composed differently.
const FOUNDERS = [
  {
    name: 'Divyanshu Ranjan',
    role: 'Co-founder and CTO',
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
    role: 'Co-founder and COO',
    photo: '/about/founders/dristi-sengupta.webp',
    focus: '50% 30%',
    zoom: 1.2,
  },
];

export function AboutFounders() {
  return (
    <section id="founders" aria-labelledby="founders-heading" className="scroll-mt-24 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader id="founders-heading" kicker="The founders" title="The people building MechHub" />

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {FOUNDERS.map(({ name, role, photo, focus, zoom }, i) => (
            <Reveal as="article" key={name} delay={i * 80} className="rounded-2xl border border-lp-border bg-lp-card p-1">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-lp-muted">
                <Image
                  src={photo}
                  alt={`Portrait of ${name}, ${role} of MechHub`}
                  fill
                  // Zoomed photos render wider than their card, so ask for a matching source size.
                  sizes={`(min-width: 1200px) ${Math.round(392 * zoom)}px, (min-width: 768px) ${Math.round(32 * zoom)}vw, ${Math.round(100 * zoom)}vw`}
                  className="object-cover"
                  style={{ objectPosition: focus, transform: `scale(${zoom})`, transformOrigin: focus }}
                />
              </div>
              <div className="p-4">
                <h3 className="heading-6">{name}</h3>
                <p className="caption-1 mt-1 text-lp-primary">{role}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <a
            href="mailto:outreach@mechhub.in"
            className="lp-press body-5 flex items-center gap-3 rounded-full border border-lp-border px-4 py-2 hover:border-lp-primary/40 hover:bg-lp-muted"
          >
            <EnvelopeSimple aria-hidden="true" className="size-4 text-lp-primary" weight="bold" />
            outreach@mechhub.in
          </a>
          <p className="body-5 flex items-center gap-3 rounded-full border border-lp-border px-4 py-2">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-lp-primary" weight="bold" />
            Atal Incubation Centre, Raise, Coimbatore, Tamil Nadu
          </p>
        </Reveal>
      </div>
    </section>
  );
}
