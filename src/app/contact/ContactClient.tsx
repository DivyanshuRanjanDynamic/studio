'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Mail, Phone, MapPin, Clock, Send, ArrowRight } from 'lucide-react';
import { V2Shell } from '@/components/V2Shell';
import { Reveal, Tag } from '@/components/home/primitives';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ContactClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || '',
      company: (formData.get('company') as string) || '',
      message: formData.get('message') as string,
    };

    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Submission failed');
      }
      setIsSubmitted(true);
      toast({ title: 'Message Sent!', description: "We'll get back to you within 24 hours." });
    } catch (err: any) {
      toast({ title: 'Something went wrong', description: err.message || 'Please try again later.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputCls =
    'h-12 border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm';

  return (
    <V2Shell>
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
          <Reveal>
            <Tag>Contact Us</Tag>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
              Get in <span className="font-lp-serif italic">Touch</span>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-4 max-w-xl text-sm text-lp-muted-fg">
              Have a question about our services, need a custom quote, or want to discuss your
              project? Fill out the form below and our team will get back to you shortly.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-10 lg:grid-cols-5 lg:gap-16">
            {/* Form */}
            <div className="lg:col-span-3">
              {isSubmitted ? (
                <Reveal>
                  <div className="flex flex-col items-center border border-lp-border bg-lp-bg py-20 text-center">
                    <div className="flex size-20 items-center justify-center bg-emerald-50 text-emerald-500">
                      <Check className="size-9" />
                    </div>
                    <p className="mt-6 text-xl font-medium">Message Received!</p>
                    <p className="mt-2 max-w-sm text-sm text-lp-muted-fg">
                      Thank you for reaching out. Our team will respond within 24 hours.
                    </p>
                    <Link
                      href="/"
                      className="lp-label-mono mt-8 inline-flex items-center gap-2 bg-lp-primary px-5 py-3 text-lp-primary-fg transition-transform hover:scale-105"
                    >
                      Back to Home <ArrowRight className="size-3" />
                    </Link>
                  </div>
                </Reveal>
              ) : (
                <Reveal>
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-6 border border-lp-border bg-lp-bg p-6 sm:p-10"
                  >
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="firstName" className="lp-label-mono text-lp-primary">
                          First name
                        </label>
                        <Input id="firstName" name="firstName" required placeholder="John" className={inputCls} />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="lastName" className="lp-label-mono text-lp-primary">
                          Last name
                        </label>
                        <Input id="lastName" name="lastName" required placeholder="Doe" className={inputCls} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="lp-label-mono text-lp-primary">
                        Work Email
                      </label>
                      <Input id="email" name="email" type="email" required placeholder="john@company.com" className={inputCls} />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label htmlFor="phone" className="lp-label-mono text-lp-primary">
                          Phone <span className="text-lp-muted-fg normal-case tracking-normal">(optional)</span>
                        </label>
                        <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" className={inputCls} />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="company" className="lp-label-mono text-lp-primary">
                          Company <span className="text-lp-muted-fg normal-case tracking-normal">(optional)</span>
                        </label>
                        <Input id="company" name="company" placeholder="Acme Inc." className={inputCls} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="lp-label-mono text-lp-primary">
                        Message
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        minLength={10}
                        placeholder="Tell us about your project..."
                        className="min-h-[140px] resize-none border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm"
                      />
                    </div>

                    <p className="text-xs text-lp-muted-fg">
                      By submitting this form, you agree to our{' '}
                      <Link href="/privacy-policy" className="text-lp-primary underline underline-offset-2">
                        Privacy Policy
                      </Link>.
                    </p>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="lp-label-mono h-14 w-full bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm text-sm transition-transform active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <>
                          Send Message <Send className="ml-2 size-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Reveal>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6 lg:col-span-2">
              <Reveal>
                <div className="border border-lp-border bg-lp-bg p-6 sm:p-8">
                  <h2 className="text-lg font-medium tracking-tight">Direct Support</h2>
                  <p className="mt-1 text-sm text-lp-muted-fg">
                    Prefer to reach out directly? Use any of the channels below.
                  </p>
                  <div className="mt-6 space-y-5">
                    {[
                      { icon: Mail, label: 'Email', value: 'outreach@mechhub.in', href: 'mailto:outreach@mechhub.in' },
                      { icon: Phone, label: 'Phone', value: '+91 9607043079', href: 'tel:+919607043079', note: 'Mon–Sun, 10AM–8PM IST' },
                      { icon: MapPin, label: 'Office', value: 'Synchubb Innovations Pvt Ltd' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center bg-lp-accent text-lp-primary">
                          <item.icon className="size-4" />
                        </div>
                        <div>
                          <p className="lp-label-mono text-lp-muted-fg">{item.label}</p>
                          {item.href ? (
                            <a href={item.href} className="text-sm font-medium text-lp-fg hover:text-lp-primary transition-colors">
                              {item.value}
                            </a>
                          ) : (
                            <p className="text-sm font-medium">{item.value}</p>
                          )}
                          {item.note && <p className="lp-label-mono mt-0.5 text-lp-muted-fg">{item.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>

              <Reveal delay={80}>
                <div className="lp-grid-bg bg-lp-primary p-6 text-lp-primary-fg sm:p-8">
                  <div className="flex size-12 items-center justify-center bg-lp-primary-fg/10 border border-lp-primary-fg/10">
                    <Clock className="size-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-medium">Response Time</h3>
                  <p className="mt-2 text-sm opacity-70 leading-relaxed">
                    Our team typically responds within{' '}
                    <span className="font-medium opacity-100">24 hours</span> on working days. For
                    urgent manufacturing queries, call us directly.
                  </p>
                </div>
              </Reveal>

              <Reveal delay={120}>
                <div className="border border-lp-border bg-lp-bg p-6 sm:p-8">
                  <h3 className="font-medium tracking-tight">Common Questions</h3>
                  <div className="mt-4 space-y-3">
                    {[
                      'What file formats do you accept?',
                      'What are your minimum order quantities?',
                      'How do I track my order?',
                    ].map((q) => (
                      <div key={q} className="flex items-center gap-3">
                        <div className="size-1.5 shrink-0 bg-lp-primary/30" />
                        <p className="text-sm text-lp-muted-fg">{q}</p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/about"
                    className="lp-label-mono mt-5 inline-flex items-center gap-1 text-lp-primary"
                  >
                    Learn More <ArrowRight className="size-3" />
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </V2Shell>
  );
}
