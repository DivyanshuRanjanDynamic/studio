import Link from 'next/link';
import Image from 'next/image';
import { Asterisk } from 'lucide-react';
import { Reveal, UploadLink } from './primitives';

const BADGES = ['NDA Protected', '72hr Turnaround', 'Made in India', 'No Minimums'];

export function FinalCTA() {
  return (
    <section className="lp-grid-bg relative overflow-hidden bg-lp-primary px-4 py-32 text-center text-lp-primary-fg sm:px-5">
      <Asterisk className="lp-spin-slow absolute -right-20 -top-20 size-96 opacity-10" strokeWidth={1} aria-hidden="true" />
      <Reveal>
        <h2 className="mx-auto max-w-3xl text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
          Ready to Build <span className="font-lp-serif italic">Something Real?</span>
        </h2>
      </Reveal>
      <Reveal delay={100}>
        <p className="mx-auto mt-6 max-w-md text-sm opacity-85">
          Upload your design and get a quote in minutes. No minimums. No negotiation. Just fast, quality parts.
        </p>
      </Reveal>
      <Reveal delay={200} className="mt-8 flex flex-wrap justify-center gap-3">
        <UploadLink className="lp-label-mono inline-flex items-center gap-2 rounded-sm bg-lp-bg px-5 py-3 text-lp-fg transition-transform hover:scale-105">
          → Upload Your Design
        </UploadLink>
        <Link
          href="/contact"
          className="lp-label-mono inline-flex items-center gap-2 rounded-sm border border-lp-primary-fg px-5 py-3 transition-colors hover:bg-lp-primary-fg hover:text-lp-primary"
        >
          Talk to an Engineer
        </Link>
      </Reveal>
      <div className="lp-label-mono mt-12 flex flex-wrap justify-center gap-6 opacity-80">
        {BADGES.map((badge) => (
          <span key={badge}>✓ {badge}</span>
        ))}
      </div>
    </section>
  );
}

const FOOTER_COLUMNS = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'How It Works', href: '#process' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    title: 'Build',
    links: [
      { label: 'Services', href: '/services' },
      { label: 'Materials', href: '/materials' },
      { label: 'Instant Quote', href: '/quote/instant' },
      { label: 'Shop', href: '/shop' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'NDA Policy', href: '/nda-policy' },
    ],
  },
];

const SOCIALS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/mechhub-in/',
    path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/mechhub.in/',
    path: 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z',
  },
];

export function HomeFooter() {
  return (
    <footer className="bg-lp-ink px-4 pb-10 pt-16 text-lp-ink-fg sm:px-5">
      <div className="mx-auto grid max-w-[1400px] gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/mechhub-logo-small.svg" alt="MechHub Logo" width={32} height={32} />
            <span className="text-2xl tracking-tight">MechHub</span>
          </Link>
          <p className="mt-4 text-sm opacity-60">Real Parts . Real Engineers . Real Deadlines</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['NDA Signed', 'ISO-Ready', 'QC Inspected', 'On-Time Delivery'].map((badge) => (
              <span key={badge} className="lp-label-mono border border-lp-ink-fg/15 px-2 py-1 opacity-60">
                {badge}
              </span>
            ))}
          </div>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="lp-label-mono text-lp-primary">{col.title}</h4>
            <ul className="mt-5 space-y-3 text-sm">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="opacity-60 transition-opacity hover:opacity-100">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="lp-label-mono mx-auto mt-14 flex max-w-[1400px] flex-wrap items-center justify-between gap-4 border-t border-lp-ink-fg/10 pt-6">
        <span className="flex items-center gap-1.5 opacity-70">
          <Asterisk className="size-4 text-lp-primary" />
          MechHub — Manufacturing Tomorrow Together
        </span>
        <span className="opacity-70">Built in India for Builders</span>
      </div>
      <div className="lp-label-mono mx-auto mt-4 flex max-w-[1400px] flex-wrap items-center justify-between gap-4 opacity-50">
        <span>
          © {new Date().getFullYear()} MechHub. All rights reserved. · A Unit of Synchubb Innovations Pvt Ltd
        </span>
        <span className="flex gap-3">
          {SOCIALS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="flex size-8 items-center justify-center border border-lp-ink-fg/20 transition-colors hover:border-lp-primary hover:text-lp-primary"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={s.path} />
              </svg>
            </a>
          ))}
        </span>
      </div>
    </footer>
  );
}
