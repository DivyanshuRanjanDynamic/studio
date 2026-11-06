'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { buttonClass } from '@/components/home/button';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/utils';

type Field = 'firstName' | 'lastName' | 'email' | 'message';
type Errors = Partial<Record<Field, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(data: FormData): Errors {
  const errors: Errors = {};
  const get = (k: string) => String(data.get(k) ?? '').trim();
  if (!get('firstName')) errors.firstName = 'Enter your first name.';
  if (!get('lastName')) errors.lastName = 'Enter your last name.';
  if (!get('email')) errors.email = 'Enter your email address.';
  else if (!EMAIL_RE.test(get('email'))) errors.email = 'Enter an email address like name@company.in.';
  if (get('message').length < 10) errors.message = 'Tell us a little more, at least 10 characters.';
  return errors;
}

const inputCls = (invalid: boolean) =>
  cn(
    'body-6 w-full rounded-xl border bg-lp-bg px-3 py-2 text-lp-fg placeholder:text-lp-muted-fg/60 transition-colors duration-300 ease-lp focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-primary',
    invalid ? 'border-lp-destructive' : 'border-lp-border hover:border-lp-fg/30'
  );

function FieldShell({
  id,
  label,
  optional = false,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="title-4 block">
        {label} {optional && <span className="caption-5 text-lp-muted-fg">(optional)</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="caption-2 flex items-center gap-2 text-lp-destructive">
          <WarningCircle aria-hidden="true" className="size-4 shrink-0" weight="bold" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Contact form with client side validation, inline errors and a calm confirmation. */
export default function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [failure, setFailure] = useState('');
  const [sentTo, setSentTo] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }

    setStatus('sending');
    const payload = {
      firstName: String(data.get('firstName')).trim(),
      lastName: String(data.get('lastName')).trim(),
      email: String(data.get('email')).trim(),
      phone: String(data.get('phone') ?? '').trim(),
      company: String(data.get('company') ?? '').trim(),
      message: String(data.get('message')).trim(),
    };

    try {
      const res = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `The server answered with status ${res.status}.`);
      }
      trackEvent('contact_submitted');
      setSentTo(payload.email);
      setStatus('sent');
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'The message could not be sent.');
      setStatus('failed');
    }
  }

  if (status === 'sent') {
    return (
      <div role="status" className="flex flex-col items-start rounded-2xl border border-lp-border bg-lp-card p-6 md:p-8">
        <CheckCircle aria-hidden="true" className="size-8 text-lp-primary" weight="duotone" />
        <h2 className="heading-5 mt-6">Message sent to the MechHub team</h2>
        <p className="body-6 mt-2 max-w-[480px] text-lp-muted-fg">
          We will reply to {sentTo} within 24 hours on working days. For an urgent order, call us on the number
          alongside.
        </p>
        <Link href="/" className={cn(buttonClass('secondary'), 'mt-8')}>
          Back to the home page
          <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
        </Link>
      </div>
    );
  }

  const describedBy = (f: Field) => (errors[f] ? `${f}-error` : undefined);

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-label="Contact MechHub"
      className="space-y-6 rounded-2xl border border-lp-border bg-lp-card p-6 md:p-8"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <FieldShell id="firstName" label="First name" error={errors.firstName}>
          <input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            required
            placeholder="Aarav"
            aria-invalid={!!errors.firstName}
            aria-describedby={describedBy('firstName')}
            className={inputCls(!!errors.firstName)}
          />
        </FieldShell>
        <FieldShell id="lastName" label="Last name" error={errors.lastName}>
          <input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
            placeholder="Mehta"
            aria-invalid={!!errors.lastName}
            aria-describedby={describedBy('lastName')}
            className={inputCls(!!errors.lastName)}
          />
        </FieldShell>
      </div>

      <FieldShell id="email" label="Email" error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="aarav@vyomrobotics.in"
          aria-invalid={!!errors.email}
          aria-describedby={describedBy('email')}
          className={inputCls(!!errors.email)}
        />
      </FieldShell>

      <div className="grid gap-6 sm:grid-cols-2">
        <FieldShell id="phone" label="Phone" optional>
          <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" className={inputCls(false)} />
        </FieldShell>
        <FieldShell id="company" label="Team or company" optional>
          <input id="company" name="company" autoComplete="organization" placeholder="Vyom Robotics" className={inputCls(false)} />
        </FieldShell>
      </div>

      <FieldShell id="message" label="Message" error={errors.message}>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={5}
          placeholder="What are you building, and which parts do you need?"
          aria-invalid={!!errors.message}
          aria-describedby={describedBy('message')}
          className={cn(inputCls(!!errors.message), 'resize-none')}
        />
      </FieldShell>

      {status === 'failed' && (
        <p role="alert" className="body-6 flex items-start gap-2 rounded-xl border border-lp-destructive/40 p-3 text-lp-destructive">
          <WarningCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" weight="bold" />
          <span>
            Your message was not sent. {failure} Try again, or email outreach@mechhub.in directly.
          </span>
        </p>
      )}

      <p className="caption-2 text-lp-muted-fg">
        By sending this form you agree to our{' '}
        <Link href="/privacy-policy" className="text-lp-primary underline underline-offset-4 hover:opacity-80">
          privacy policy
        </Link>
        .
      </p>

      <button
        type="submit"
        disabled={status === 'sending'}
        aria-busy={status === 'sending'}
        className={cn(buttonClass('primary'), 'w-full disabled:cursor-wait disabled:opacity-60 sm:w-auto')}
      >
        {status === 'sending' ? 'Sending your message' : 'Send message'}
        {status !== 'sending' && <ArrowRight aria-hidden="true" className="size-4" weight="bold" />}
      </button>
    </form>
  );
}
