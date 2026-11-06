import { publishedStats, publishedTestimonials } from './proof';
import { Reveal, SectionHeader } from './primitives';

/**
 * Social proof. Renders only the stats and quotes that have real values in proof.ts,
 * and nothing at all until at least one exists, so placeholders never go live.
 */
export function Testimonials() {
  if (!publishedStats.length && !publishedTestimonials.length) return null;

  return (
    <section aria-labelledby="proof-heading" className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader id="proof-heading" kicker="Customers" title="Teams that build real things" />

        {publishedTestimonials.length > 0 && (
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {publishedTestimonials.map((t, i) => (
              <Reveal
                as="article"
                key={`${t.name}-${i}`}
                delay={i * 80}
                className="flex flex-col justify-between gap-8 rounded-2xl border border-lp-border bg-lp-card p-6"
              >
                <div>
                  <span className="caption-3 text-lp-primary">{t.project}</span>
                  <blockquote className="body-3 mt-4">&ldquo;{t.quote}&rdquo;</blockquote>
                </div>
                <footer>
                  <div className="title-4">{t.name}</div>
                  <div className="caption-5 text-lp-muted-fg">{t.role}</div>
                </footer>
              </Reveal>
            ))}
          </div>
        )}

        {publishedStats.length > 0 && (
          <dl className="mt-12 grid gap-4 sm:grid-cols-3">
            {publishedStats.map((s, i) => (
              <Reveal key={s.label} delay={i * 80} className="rounded-2xl border border-lp-border p-6">
                <dt className="caption-1 text-lp-muted-fg">{s.label}</dt>
                <dd className="heading-3 lp-num mt-2 text-lp-primary">{s.value}</dd>
              </Reveal>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
