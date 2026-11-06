import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, EnvelopeSimple, MapPin, Phone } from '@phosphor-icons/react/dist/ssr';
import { V2Shell } from '@/components/V2Shell';
import { Accent, Reveal, Tag } from '@/components/home/primitives';
import ContactForm from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact MechHub | Precision Manufacturing Support',
  description:
    'Have a question about our CNC, laser cutting, or fabrication services? Get in touch with the MechHub team for custom quotes and project support.',
  alternates: {
    canonical: '/contact',
  },
};

const CHANNELS = [
  { icon: EnvelopeSimple, label: 'Email', value: 'outreach@mechhub.in', href: 'mailto:outreach@mechhub.in' },
  { icon: Phone, label: 'Phone', value: '+91 96070 43079', href: 'tel:+919607043079', note: 'Monday to Sunday, 10 am to 8 pm IST' },
  { icon: MapPin, label: 'Office', value: 'Synchubb Innovations Pvt Ltd, Atal Incubation Centre, Raise, Coimbatore' },
];

export default function ContactPage() {
  return (
    <V2Shell>
      <section aria-labelledby="contact-heading" className="px-4 pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-[680px]">
            <span className="lp-hero-in inline-block">
              <Tag>Contact</Tag>
            </span>
            <h1 id="contact-heading" className="heading-1 lp-hero-heading lp-hero-in mt-4" style={{ animationDelay: '60ms' }}>
              Talk to an <Accent>engineer</Accent>
            </h1>
            <p className="body-3 lp-hero-in mt-6 text-lp-muted-fg" style={{ animationDelay: '120ms' }}>
              Need a custom quote, a process we do not list, or help with a drawing? Send us a message and a MechHub
              engineer will reply within 24 hours on working days.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="lp-hero-in" style={{ animationDelay: '180ms' }}>
              <ContactForm />
            </div>

            <aside aria-label="Other ways to reach us" className="space-y-4">
              <Reveal className="rounded-2xl border border-lp-border p-6">
                <h2 className="heading-6">Reach us directly</h2>
                <ul className="mt-6 space-y-6">
                  {CHANNELS.map(({ icon: Icon, label, value, href, note }) => (
                    <li key={label} className="flex items-start gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-lp-primary/10 text-lp-primary">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <p className="caption-4 text-lp-muted-fg">{label}</p>
                        {href ? (
                          <a href={href} className="body-5 rounded transition-colors duration-300 ease-lp hover:text-lp-primary">
                            {value}
                          </a>
                        ) : (
                          <p className="body-5">{value}</p>
                        )}
                        {note && <p className="caption-5 mt-1 text-lp-muted-fg">{note}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={80} className="rounded-2xl bg-lp-ink p-6 text-lp-ink-fg">
                <Clock aria-hidden="true" className="size-6 text-lp-primary" weight="duotone" />
                <h2 className="heading-6 mt-4">Replies within 24 hours</h2>
                <p className="body-6 mt-2 text-lp-ink-fg/70">
                  On working days. For an urgent manufacturing question, call us directly.
                </p>
              </Reveal>

              <Reveal delay={120} className="rounded-2xl border border-lp-border p-6">
                <h2 className="heading-6">Quick answers</h2>
                <p className="body-6 mt-2 text-lp-muted-fg">
                  File formats, minimum orders, delivery and NDA protection are covered in the{' '}
                  <Link href="/#faq" className="text-lp-primary underline underline-offset-4 hover:opacity-80">
                    FAQ on the home page
                  </Link>
                  .
                </p>
              </Reveal>
            </aside>
          </div>
        </div>
      </section>
    </V2Shell>
  );
}
