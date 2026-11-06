import { Clock, LockKey, MapPin } from '@phosphor-icons/react/dist/ssr';
import { Accent, CtaButton, Tag } from '@/components/home/primitives';
import { AboutVisual } from './AboutVisual';

const PROOF = [
  { icon: Clock, label: '72 hour average turnaround' },
  { icon: LockKey, label: 'NDA on every file' },
  { icon: MapPin, label: 'Delivered across India' },
];

export function AboutHero() {
  return (
    <section aria-labelledby="about-heading" className="px-4 pb-16 pt-8 md:pb-24 md:pt-16">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="max-w-[680px]">
          <span className="lp-hero-in inline-block">
            <Tag>About MechHub</Tag>
          </span>
          <h1 id="about-heading" className="heading-1 lp-hero-heading lp-hero-in mt-4" style={{ animationDelay: '60ms' }}>
            From CAD file <br className="hidden sm:block" />
            to <Accent>real part</Accent>
          </h1>
          <p className="body-3 lp-hero-in mt-6 text-lp-muted-fg" style={{ animationDelay: '120ms' }}>
            MechHub is a managed marketplace for custom manufacturing in India. Upload a design, get an instant quote,
            and vetted manufacturing partners make your parts and deliver them anywhere in the country.
          </p>
          <div className="lp-hero-in mt-8" style={{ animationDelay: '180ms' }}>
            <CtaButton>Get an instant quote</CtaButton>
          </div>
          <ul className="lp-hero-in mt-6 flex flex-wrap gap-x-6 gap-y-2 text-lp-muted-fg" style={{ animationDelay: '240ms' }}>
            {PROOF.map(({ icon: Icon, label }) => (
              <li key={label} className="caption-1 flex items-center gap-2">
                <Icon aria-hidden="true" className="size-4 text-lp-primary" weight="bold" />
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="lp-hero-in" style={{ animationDelay: '200ms' }}>
          <AboutVisual />
        </div>
      </div>
    </section>
  );
}
