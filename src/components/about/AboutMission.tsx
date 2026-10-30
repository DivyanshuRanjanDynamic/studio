import { Reveal, Tag } from '@/components/home/primitives';

const STATEMENT = [
  { text: 'Getting one custom part made used to mean emailing ten vendors, waiting days for ten different answers, and hitting minimum orders built for factories.' },
  { text: 'MechHub replaces all of that with' },
  { text: 'one upload, one quote and one order,', accent: true },
  { text: 'so anyone with a design can get it made.' },
];

const WORDS = STATEMENT.flatMap(({ text, accent }) => text.split(' ').map((word) => ({ word, accent })));

/** Each word lights up as the statement scrolls through the viewport (CSS scroll timeline). */
export function AboutMission() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-24 sm:px-5 md:py-36">
      <Reveal>
        <Tag>Why We Exist</Tag>
      </Reveal>
      <p className="about-lit mt-8 max-w-5xl text-[2rem] leading-[1.15] tracking-tight md:text-[3.5rem]">
        {WORDS.map(({ word, accent }, i) => (
          <span
            key={i}
            className={`about-lit-word ${accent ? 'lp-accent-serif' : ''}`}
            style={{ '--from': `${12 + (i / WORDS.length) * 30}%` } as React.CSSProperties}
          >
            {word}{' '}
          </span>
        ))}
      </p>
    </section>
  );
}
