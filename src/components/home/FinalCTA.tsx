import Link from 'next/link';
import Image from 'next/image';
import { Check, InstagramLogo, LinkedinLogo } from '@phosphor-icons/react/dist/ssr';
import type { ReactNode } from 'react';
import { Accent, CtaButton, Reveal, Tag } from './primitives';

const RISK_REVERSAL = ['No minimum quantity', 'NDA on every file', 'Full quote before you order'];

/** Final call to action: the same offer as the hero, plus risk reversal. */
export function FinalCTA({
  heading = (
    <>
      Ready to bring your <Accent light>part</Accent> to life?
    </>
  ),
  lead = 'Upload your design and see the full price in seconds. A vetted MechMaster takes it from there.',
  cta = 'Get an instant quote',
  badges = RISK_REVERSAL,
  href,
}: {
  heading?: ReactNode;
  lead?: string;
  cta?: string;
  badges?: string[];
  /** Where the main button goes. Omit for the upload flow, like the hero. */
  href?: string;
} = {}) {
  return (
    <section aria-labelledby="final-cta-heading" className="px-4 py-16 md:py-24">
      <Reveal className="lp-blueprint lp-marks mx-auto max-w-[1200px] overflow-hidden rounded-3xl px-6 py-16 text-center text-lp-primary-fg md:py-24">
        <Tag inverted>Get started</Tag>
        <h2 id="final-cta-heading" className="heading-2 mx-auto mt-4 max-w-[680px]">
          {heading}
        </h2>
        <p className="body-3 mx-auto mt-4 max-w-[560px] text-lp-primary-fg/80">
          {lead}
        </p>
        <div className="mt-8 flex flex-col items-center gap-4">
          <CtaButton variant="inverted" href={href}>
            {cta}
          </CtaButton>
          {href !== '/contact' && (
            <Link
              href="/contact"
              className="button-sm rounded text-lp-primary-fg/80 underline underline-offset-4 transition-colors duration-300 ease-lp hover:text-lp-primary-fg"
            >
              Or talk to an engineer
            </Link>
          )}
        </div>
        <ul className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {badges.map((item) => (
            <li key={item} className="lp-mono flex items-center gap-2 text-lp-primary-fg/90">
              <Check aria-hidden="true" className="size-4" weight="bold" />
              {item}
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

const FOOTER_COLUMNS = [
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '/about' },
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Become a MechMaster', href: '/onboard' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Build',
    links: [
      { label: 'Services', href: '/services' },
      { label: 'Materials', href: '/materials' },
      { label: 'Instant quote', href: '/quote/instant' },
      { label: 'Shop', href: '/shop' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: '/privacy-policy' },
      { label: 'Terms of service', href: '/terms-of-service' },
      { label: 'Refund policy', href: '/refund-policy' },
      { label: 'NDA policy', href: '/nda-policy' },
    ],
  },
];

const SOCIALS = [
  { label: 'MechHub on LinkedIn', href: 'https://www.linkedin.com/company/mechhub-in/', icon: LinkedinLogo },
  { label: 'MechHub on Instagram', href: 'https://www.instagram.com/mechhub.in/', icon: InstagramLogo },
];

export function HomeFooter() {
  return (
    <footer className="bg-lp-ink px-4 pb-8 pt-16 text-lp-ink-fg">
      <div className="mx-auto grid max-w-[1200px] gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 rounded" aria-label="MechHub home">
            <Image src="/mechhub-logo-small.svg" alt="" width={32} height={32} />
            <span className="heading-6">MechHub</span>
          </Link>
          <p className="body-6 mt-4 max-w-[320px] text-lp-ink-fg/60">
            Custom manufacturing for students, startups and hobbyists. Real parts, real engineers, real deadlines.
          </p>
          <div className="mt-6 flex gap-2">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="lp-press flex size-10 items-center justify-center rounded-full border border-lp-ink-fg/15 hover:border-lp-ink-fg/40 hover:bg-lp-ink-fg/5"
              >
                <Icon aria-hidden="true" className="size-4" weight="bold" />
              </a>
            ))}
          </div>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="title-4 text-lp-ink-fg">{col.title}</h2>
            <ul className="mt-4 space-y-3">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="body-6 rounded text-lp-ink-fg/60 transition-colors duration-300 ease-lp hover:text-lp-ink-fg"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <p
        aria-hidden="true"
        className="mx-auto mt-16 max-w-[1200px] select-none text-6xl font-medium leading-none tracking-tighter text-lp-ink-fg/10 md:text-9xl"
      >
        Mech<span className="lp-accent lp-accent-light opacity-10">Hub</span>
      </p>

      <div className="caption-5 mx-auto mt-8 flex max-w-[1200px] flex-wrap items-center justify-between gap-4 border-t border-lp-ink-fg/10 pt-6 text-lp-ink-fg/50">
        <span>© {new Date().getFullYear()} MechHub, a unit of Synchubb Innovations Pvt Ltd</span>
        <span>Built in India for builders</span>
      </div>
    </footer>
  );
}
