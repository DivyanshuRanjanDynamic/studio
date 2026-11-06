'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Angle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleNotch,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Fire,
  Gear,
  Lightning,
  PaintRoller,
  PencilSimple,
  PlusCircle,
  SealCheck,
  ShieldCheck,
  WarningCircle,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';
import '@/components/home/landing.css';
import { landingFontVars } from '@/components/home/fonts';
import { buttonClass } from '@/components/home/button';
import { Tag } from '@/components/home/primitives';
import { fieldClass } from '@/components/auth/AuthShell';
import { HelpLine, JOIN_STEPS, KEEP_READY, StepList } from '@/components/auth/AuthPanel';
import { trackEvent } from '@/lib/analytics';
import { VENDOR_CAPABILITIES, NDA_AGREEMENT_TEXT, indianPhoneRegex, gstRegex } from '@/lib/vendor-onboarding';
import { cn } from '@/utils';

interface FormState {
  companyName: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  location: string;
  city: string;
  pincode: string;
  gstNumber: string;
  capabilities: string[];
  otherCapability: string;
  monthlyRevenue: string;
  ndaAgreed: boolean;
  password: string;
  confirmPassword: string;
}

const INITIAL_STATE: FormState = {
  companyName: '',
  ownerName: '',
  contactNumber: '',
  email: '',
  location: '',
  city: '',
  pincode: '',
  gstNumber: '',
  capabilities: [],
  otherCapability: '',
  monthlyRevenue: '',
  ndaAgreed: false,
  password: '',
  confirmPassword: '',
};

const ONBOARDING_STEPS = [
  { id: 'business', label: 'Your business', hint: 'Company, contact and workshop', title: 'Tell us about your business', lead: 'Who runs the shop and where it is. We use this to contact you and to route nearby orders.' },
  { id: 'capabilities', label: 'What you make', hint: 'Processes and capacity', title: 'What does your shop make?', lead: 'Pick every process you run in house. You can add more after approval.' },
  { id: 'security', label: 'Your sign in', hint: 'Password for the portal', title: 'Create your sign in', lead: 'You will use this to sign in to the MechMaster portal once your email is verified.' },
  { id: 'compliance', label: 'Review and NDA', hint: 'Check details and agree', title: 'Review and sign the NDA', lead: 'Check your details, then accept the confidentiality agreement to send your application.' },
] as const;

type StepId = (typeof ONBOARDING_STEPS)[number]['id'];

/** Fields that belong to each step, in screen order (used to focus the first error). */
const STEP_FIELDS: Record<StepId, string[]> = {
  business: ['companyName', 'ownerName', 'contactNumber', 'email', 'location', 'city', 'pincode', 'gstNumber'],
  capabilities: ['capabilities', 'otherCapability'],
  security: ['password', 'confirmPassword'],
  compliance: ['ndaAgreed'],
};

const CAPABILITY_INFO: Record<string, { icon: typeof Gear; body: string }> = {
  'CNC Machining': { icon: Gear, body: 'Milling and turning' },
  'Laser Cutting': { icon: Lightning, body: 'Fiber or CO₂ sheet cutting' },
  Welding: { icon: Fire, body: 'MIG, TIG or arc' },
  Fabrication: { icon: Wrench, body: 'Assemblies and frames' },
  Bending: { icon: Angle, body: 'Press brake forming' },
  'Surface Finish': { icon: PaintRoller, body: 'Powder coat, anodize, plating' },
  Other: { icon: PlusCircle, body: 'Tell us what else you run' },
};

const REVENUE_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'below_1L', label: 'Below ₹1L' },
  { value: '1L_5L', label: '₹1L to ₹5L' },
  { value: '5L_20L', label: '₹5L to ₹20L' },
  { value: '20L_plus', label: '₹20L+' },
];

export default function VendorOnboardingPage() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};

    if (!form.companyName.trim()) {
      next.companyName = 'Enter your company name.';
    } else if (form.companyName.trim().length < 2) {
      next.companyName = 'Company name must be at least 2 characters.';
    }

    if (!form.ownerName.trim()) {
      next.ownerName = 'Enter the owner’s name.';
    } else if (form.ownerName.trim().length < 2) {
      next.ownerName = 'Owner name must be at least 2 characters.';
    }

    if (!form.contactNumber.trim()) {
      next.contactNumber = 'Enter a mobile number.';
    } else if (!indianPhoneRegex.test(form.contactNumber.trim())) {
      next.contactNumber = 'Enter a 10 digit Indian mobile number.';
    }

    if (!form.email.trim()) {
      next.email = 'Enter an email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email, like you@company.in.';
    }

    if (!form.location.trim()) {
      next.location = 'Enter your workshop address.';
    } else if (form.location.trim().length < 3) {
      next.location = 'Address must be at least 3 characters.';
    }

    if (!form.city.trim()) {
      next.city = 'Enter your city.';
    } else if (form.city.trim().length < 2) {
      next.city = 'City must be at least 2 characters.';
    }

    if (!form.pincode.trim()) {
      next.pincode = 'Enter your pincode.';
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      next.pincode = 'Enter a 6 digit pincode.';
    }

    if (form.gstNumber.trim() && !gstRegex.test(form.gstNumber.trim())) {
      next.gstNumber = 'That GST number does not look right. It has 15 characters.';
    }

    if (form.capabilities.length === 0) {
      next.capabilities = 'Pick at least one process.';
    }

    if (form.capabilities.includes('Other')) {
      if (!form.otherCapability.trim()) {
        next.otherCapability = 'Tell us the other process.';
      } else if (form.otherCapability.trim().length < 2) {
        next.otherCapability = 'Must be at least 2 characters.';
      }
    }

    if (!form.password) {
      next.password = 'Create a password.';
    } else if (form.password.length < 8) {
      next.password = 'Use at least 8 characters.';
    }

    if (!form.confirmPassword) {
      next.confirmPassword = 'Type the password again.';
    } else if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Passwords do not match.';
    }

    if (!form.ndaAgreed) {
      next.ndaAgreed = 'Accept the agreement to send your application.';
    }

    return next;
  }, [form]);

  const stepStatus = useMemo(() => {
    return {
      business: !errors.companyName && !errors.ownerName && !errors.contactNumber && !errors.email && !errors.location && !errors.city && !errors.pincode && !errors.gstNumber,
      capabilities: !errors.capabilities && !errors.otherCapability,
      security: !errors.password && !errors.confirmPassword && form.password.length >= 8,
      compliance: form.ndaAgreed,
    };
  }, [errors, form.ndaAgreed, form.password]);

  const step = ONBOARDING_STEPS[activeStepIndex];
  const isLastStep = activeStepIndex === ONBOARDING_STEPS.length - 1;

  const setField = (key: keyof FormState, value: string | boolean | string[]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const toggleCapability = (capability: string, checked: boolean) => {
    setForm((prev) => {
      const nextCaps = checked
        ? Array.from(new Set([...prev.capabilities, capability]))
        : prev.capabilities.filter((cap) => cap !== capability);

      return {
        ...prev,
        capabilities: nextCaps,
        otherCapability: checked || capability !== 'Other' ? prev.otherCapability : '',
      };
    });
  };

  const showError = (field: string) => (touched[field] && errors[field]) || undefined;

  const goTo = (idx: number) => {
    setBanner(null);
    setActiveStepIndex(idx);
    requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      cardRef.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    });
  };

  /** Shows a step's errors, says so at the top of the card, and moves focus to the first one. */
  const blockStep = (id: StepId, message: string) => {
    const fields = STEP_FIELDS[id];
    setTouched((prev) => ({ ...prev, ...Object.fromEntries(fields.map((f) => [f, true])) }));
    setBanner(message);
    const first = fields.find((f) => errors[f]);
    requestAnimationFrame(() => {
      const el = first ? (document.getElementById(first) ?? document.querySelector<HTMLElement>(`[data-field="${first}"]`)) : null;
      el?.focus();
    });
  };

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const currentStepId = step.id;
    if (!stepStatus[currentStepId]) {
      const messages: Record<StepId, string> = {
        business: 'A few business details need fixing before you continue.',
        capabilities: 'Pick at least one process your shop runs.',
        security: 'Set a password of at least 8 characters and type it twice.',
        compliance: 'Accept the confidentiality agreement to send your application.',
      };
      blockStep(currentStepId, messages[currentStepId]);
      return;
    }

    if (!isLastStep) {
      goTo(activeStepIndex + 1);
    } else {
      executeSubmit();
    }
  };

  const handlePrevStep = () => {
    if (activeStepIndex > 0) goTo(activeStepIndex - 1);
  };

  const canOpenStep = (idx: number) =>
    idx <= activeStepIndex || (idx > 0 && stepStatus[ONBOARDING_STEPS[idx - 1].id]);

  const executeSubmit = async () => {
    setTouched(Object.fromEntries(Object.values(STEP_FIELDS).flat().map((f) => [f, true])));

    if (!Object.values(stepStatus).every(Boolean)) {
      const firstBad = ONBOARDING_STEPS.findIndex((s) => !stepStatus[s.id]);
      goTo(firstBad);
      setBanner('Some details are missing. Fix the highlighted fields, then submit again.');
      return;
    }

    setBanner(null);
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: form.companyName.trim(),
          ownerName: form.ownerName.trim(),
          contactNumber: form.contactNumber.trim(),
          email: form.email.trim().toLowerCase(),
          workshopAddress: `${form.location.trim()}, ${form.city.trim()} - ${form.pincode.trim()}`,
          gstNumber: form.gstNumber.trim() || undefined,
          capabilities: form.capabilities,
          otherCapability: form.otherCapability.trim() || undefined,
          monthlyRevenue: form.monthlyRevenue || undefined,
          ndaAgreed: form.ndaAgreed,
          password: form.password,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        if (result?.details) {
          console.error('Validation details:', result.details);
          throw new Error(`Please check these fields: ${Object.keys(result.details.fieldErrors || {}).join(', ')}`);
        }
        throw new Error(result?.error || 'We could not send your application.');
      }

      setSubmittedEmail(form.email.trim().toLowerCase());
      setSubmitted(true);
      trackEvent('vendor_application_submitted');
      setForm(INITIAL_STATE);
      setTouched({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error: any) {
      setBanner(`${error?.message || 'We could not send your application.'} Try again in a moment, or call us on the number below.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('lp-root min-h-screen', landingFontVars)} suppressHydrationWarning>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-lp-bg focus:px-4 focus:py-2">
        Skip to the form
      </a>

      <header className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 py-6 md:px-8">
        <Link href="/" className="flex items-center gap-2 rounded-full" aria-label="MechHub home">
          <Image src="/mechhub-logo-small.svg" alt="" width={28} height={28} />
          <span className="title-3">MechHub</span>
        </Link>
        <nav aria-label="Account" className="flex items-center gap-1">
          <Link href="/" className="caption-1 hidden items-center gap-2 rounded-full px-3 py-2 text-lp-muted-fg transition-colors duration-300 ease-lp hover:bg-lp-muted hover:text-lp-fg sm:flex">
            <ArrowLeft aria-hidden="true" className="size-4" weight="bold" />
            Back to home
          </Link>
          <Link href="/login?tab=login" className={buttonClass('secondary', 'sm')}>
            Sign in
          </Link>
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 pb-16 md:px-8 lg:grid-cols-[320px_1fr] lg:gap-12">
        {/* Sidebar: where you are, and what happens next */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <Tag>Become a MechMaster</Tag>
          <p className="heading-5 mt-4">Apply to join the network</p>
          <p className="body-6 mt-2 text-lp-muted-fg">
            For laser, CNC and fabrication shops. Approved shops get orders through MechHub, with drawings and specs sorted.
          </p>

          {!submitted && (
            <>
              <div className="mt-6 lg:hidden">
                <div className="caption-1 flex justify-between">
                  <span>
                    Step {activeStepIndex + 1} of {ONBOARDING_STEPS.length}
                  </span>
                  <span className="text-lp-muted-fg">{step.label}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-lp-muted">
                  <div
                    className="h-full rounded-full bg-lp-primary transition-[width] duration-500 ease-lp"
                    style={{ width: `${((activeStepIndex + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              <ol aria-label="Application steps" className="mt-8 hidden space-y-1 lg:block">
                {ONBOARDING_STEPS.map((s, idx) => {
                  const isActive = idx === activeStepIndex;
                  const isDone = stepStatus[s.id] && idx < activeStepIndex;
                  const open = canOpenStep(idx);
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        disabled={!open}
                        aria-current={isActive ? 'step' : undefined}
                        onClick={() => open && goTo(idx)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors duration-300 ease-lp',
                          isActive ? 'bg-lp-card' : open ? 'hover:bg-lp-card' : 'cursor-not-allowed opacity-60'
                        )}
                      >
                        <span
                          className={cn(
                            'lp-mono flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 ease-lp',
                            isDone
                              ? 'border-lp-primary bg-lp-primary text-lp-primary-fg'
                              : isActive
                                ? 'border-lp-primary text-lp-primary'
                                : 'border-lp-border text-lp-muted-fg'
                          )}
                        >
                          {isDone ? <Check aria-label="Done" className="size-4" weight="bold" /> : String(idx + 1).padStart(2, '0')}
                        </span>
                        <span>
                          <span className={cn('title-4 block', !isActive && 'text-lp-muted-fg')}>{s.label}</span>
                          <span className="caption-5 text-lp-muted-fg">{s.hint}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-8 hidden rounded-2xl border border-lp-border p-4 lg:block">
                <p className="lp-mono text-lp-muted-fg">Keep these ready</p>
                <ul className="mt-3 space-y-2">
                  {KEEP_READY.map((item) => (
                    <li key={item} className="caption-2 flex items-center gap-2">
                      <Check aria-hidden="true" className="size-4 shrink-0 text-lp-primary" weight="bold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </aside>

        <main id="main" className="min-w-0">
          {submitted ? (
            <SubmittedCard email={submittedEmail} />
          ) : (
            <div ref={cardRef} className="scroll-mt-6 rounded-3xl border border-lp-border bg-lp-bg">
              <form onSubmit={handleNextStep} noValidate>
                <div className="border-b border-lp-border p-6 md:p-8">
                  <p className="lp-mono text-lp-primary">
                    Step {String(activeStepIndex + 1).padStart(2, '0')} of {String(ONBOARDING_STEPS.length).padStart(2, '0')}
                  </p>
                  <h1 tabIndex={-1} className="heading-5 mt-2 focus:outline-none">
                    {step.title}
                  </h1>
                  <p className="body-6 mt-1 text-lp-muted-fg">{step.lead}</p>
                </div>

                <div className="space-y-6 p-6 md:p-8">
                  {banner && (
                    <div role="alert" className="caption-2 flex items-start gap-3 rounded-xl border border-lp-destructive/30 bg-lp-destructive/5 p-4 text-lp-destructive">
                      <WarningCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" weight="fill" />
                      {banner}
                    </div>
                  )}

                  {step.id === 'business' && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field id="companyName" label="Company name" error={showError('companyName')}>
                        <input id="companyName" autoComplete="organization" value={form.companyName} onBlur={() => markTouched('companyName')} onChange={(e) => setField('companyName', e.target.value)} aria-invalid={!!showError('companyName')} aria-describedby={showError('companyName') ? 'companyName-error' : undefined} className={fieldClass(!!showError('companyName'))} />
                      </Field>
                      <Field id="ownerName" label="Owner name" error={showError('ownerName')}>
                        <input id="ownerName" autoComplete="name" value={form.ownerName} onBlur={() => markTouched('ownerName')} onChange={(e) => setField('ownerName', e.target.value)} aria-invalid={!!showError('ownerName')} aria-describedby={showError('ownerName') ? 'ownerName-error' : undefined} className={fieldClass(!!showError('ownerName'))} />
                      </Field>
                      <Field id="contactNumber" label="Mobile number" hint="We call this number about your application." error={showError('contactNumber')}>
                        <div className="relative">
                          <span aria-hidden="true" className="body-6 pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lp-muted-fg">
                            +91
                          </span>
                          <input
                            id="contactNumber"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel-national"
                            maxLength={10}
                            placeholder="98765 43210"
                            value={form.contactNumber}
                            onBlur={() => markTouched('contactNumber')}
                            onChange={(e) => setField('contactNumber', e.target.value.replace(/\D/g, ''))}
                            aria-invalid={!!showError('contactNumber')}
                            aria-describedby={showError('contactNumber') ? 'contactNumber-error' : 'contactNumber-hint'}
                            className={cn(fieldClass(!!showError('contactNumber')), 'pl-12 tabular-nums')}
                          />
                        </div>
                      </Field>
                      <Field id="email" label="Email" hint="You will sign in with this." error={showError('email')}>
                        <input id="email" type="email" autoComplete="email" placeholder="you@company.in" value={form.email} onBlur={() => markTouched('email')} onChange={(e) => setField('email', e.target.value)} aria-invalid={!!showError('email')} aria-describedby={showError('email') ? 'email-error' : 'email-hint'} className={fieldClass(!!showError('email'))} />
                      </Field>
                      <Field id="location" label="Workshop address" hint="Building, street and area." error={showError('location')} className="sm:col-span-2">
                        <input id="location" autoComplete="street-address" value={form.location} onBlur={() => markTouched('location')} onChange={(e) => setField('location', e.target.value)} aria-invalid={!!showError('location')} aria-describedby={showError('location') ? 'location-error' : 'location-hint'} className={fieldClass(!!showError('location'))} />
                      </Field>
                      <Field id="city" label="City" error={showError('city')}>
                        <input id="city" autoComplete="address-level2" value={form.city} onBlur={() => markTouched('city')} onChange={(e) => setField('city', e.target.value)} aria-invalid={!!showError('city')} aria-describedby={showError('city') ? 'city-error' : undefined} className={fieldClass(!!showError('city'))} />
                      </Field>
                      <Field id="pincode" label="Pincode" error={showError('pincode')}>
                        <input id="pincode" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={form.pincode} onBlur={() => markTouched('pincode')} onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, ''))} aria-invalid={!!showError('pincode')} aria-describedby={showError('pincode') ? 'pincode-error' : undefined} className={cn(fieldClass(!!showError('pincode')), 'tabular-nums')} />
                      </Field>
                      <Field id="gstNumber" label="GST number" optional hint="Leave blank if you do not have one yet." error={showError('gstNumber')} className="sm:col-span-2">
                        <input id="gstNumber" maxLength={15} placeholder="33ABCDE1234F1Z5" value={form.gstNumber} onBlur={() => markTouched('gstNumber')} onChange={(e) => setField('gstNumber', e.target.value.toUpperCase())} aria-invalid={!!showError('gstNumber')} aria-describedby={showError('gstNumber') ? 'gstNumber-error' : 'gstNumber-hint'} className={cn(fieldClass(!!showError('gstNumber')), 'uppercase tracking-wide')} />
                      </Field>
                    </div>
                  )}

                  {step.id === 'capabilities' && (
                    <>
                      <fieldset aria-describedby={showError('capabilities') ? 'capabilities-error' : undefined}>
                        <legend className="title-4">
                          Processes you run <span className="caption-5 text-lp-muted-fg">· pick all that apply</span>
                        </legend>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {VENDOR_CAPABILITIES.map((capability, i) => {
                            const info = CAPABILITY_INFO[capability];
                            const Icon = info?.icon ?? PlusCircle;
                            const checked = form.capabilities.includes(capability);
                            return (
                              <label
                                key={capability}
                                className={cn(
                                  'relative flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors duration-300 ease-lp has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lp-primary',
                                  checked ? 'border-lp-primary bg-lp-primary/5' : 'border-lp-border hover:border-lp-fg/30'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  data-field={i === 0 ? 'capabilities' : undefined}
                                  checked={checked}
                                  onChange={(e) => {
                                    markTouched('capabilities');
                                    toggleCapability(capability, e.target.checked);
                                  }}
                                />
                                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', checked ? 'bg-lp-primary text-lp-primary-fg' : 'bg-lp-muted text-lp-fg')}>
                                  <Icon aria-hidden="true" className="size-5" weight={checked ? 'fill' : 'regular'} />
                                </span>
                                <span className="min-w-0 pr-6">
                                  <span className="title-4 block">{capability}</span>
                                  <span className="caption-5 text-lp-muted-fg">{info?.body}</span>
                                </span>
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'absolute right-3 top-3 flex size-5 items-center justify-center rounded-md border transition-colors duration-300 ease-lp',
                                    checked ? 'border-lp-primary bg-lp-primary text-lp-primary-fg' : 'border-lp-border bg-lp-bg'
                                  )}
                                >
                                  {checked && <Check className="size-3" weight="bold" />}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                        {showError('capabilities') && <FieldError id="capabilities-error">{errors.capabilities}</FieldError>}
                      </fieldset>

                      {form.capabilities.includes('Other') && (
                        <Field id="otherCapability" label="Other process" hint="For example: sheet metal stamping, EDM, casting." error={showError('otherCapability')}>
                          <input id="otherCapability" value={form.otherCapability} onBlur={() => markTouched('otherCapability')} onChange={(e) => setField('otherCapability', e.target.value)} aria-invalid={!!showError('otherCapability')} aria-describedby={showError('otherCapability') ? 'otherCapability-error' : 'otherCapability-hint'} className={fieldClass(!!showError('otherCapability'))} />
                        </Field>
                      )}

                      <fieldset>
                        <legend className="title-4">
                          Monthly revenue <span className="caption-5 text-lp-muted-fg">· optional</span>
                        </legend>
                        <p className="caption-5 mt-1 text-lp-muted-fg">Helps us match orders to your capacity.</p>
                        <div role="radiogroup" className="mt-3 flex flex-wrap gap-2">
                          {REVENUE_OPTIONS.map((o) => {
                            const checked = form.monthlyRevenue === o.value;
                            return (
                              <label
                                key={o.label}
                                className={cn(
                                  'caption-1 cursor-pointer rounded-full border px-4 py-2 transition-colors duration-300 ease-lp has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-lp-primary',
                                  checked ? 'border-lp-primary bg-lp-primary text-lp-primary-fg' : 'border-lp-border hover:border-lp-fg/30'
                                )}
                              >
                                <input type="radio" name="monthlyRevenue" className="sr-only" checked={checked} onChange={() => setField('monthlyRevenue', o.value)} />
                                {o.label}
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    </>
                  )}

                  {step.id === 'security' && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3 rounded-xl bg-lp-card p-4">
                        <EnvelopeSimple aria-hidden="true" className="size-5 shrink-0 text-lp-primary" weight="duotone" />
                        <p className="caption-2">
                          You will sign in as <span className="font-medium">{form.email.trim() || 'the email you entered'}</span>
                        </p>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <Field id="password" label="Password" error={showError('password')}>
                          <PasswordField id="password" value={form.password} show={showPassword} onToggle={() => setShowPassword((v) => !v)} onBlur={() => markTouched('password')} onChange={(v) => setField('password', v)} invalid={!!showError('password')} />
                        </Field>
                        <Field id="confirmPassword" label="Type it again" error={showError('confirmPassword')}>
                          <PasswordField id="confirmPassword" value={form.confirmPassword} show={showConfirmPassword} onToggle={() => setShowConfirmPassword((v) => !v)} onBlur={() => markTouched('confirmPassword')} onChange={(v) => setField('confirmPassword', v)} invalid={!!showError('confirmPassword')} />
                        </Field>
                      </div>
                      <ul aria-label="Password checks" className="space-y-2">
                        <Requirement ok={form.password.length >= 8}>At least 8 characters</Requirement>
                        <Requirement ok={!!form.confirmPassword && form.confirmPassword === form.password}>Both passwords match</Requirement>
                      </ul>
                    </div>
                  )}

                  {step.id === 'compliance' && (
                    <div className="space-y-6">
                      <div className="grid gap-3 md:grid-cols-3">
                        <ReviewBlock title="Business" onEdit={() => goTo(0)}>
                          <span className="block">{form.companyName || '—'}</span>
                          <span className="block text-lp-muted-fg">{form.ownerName}</span>
                          <span className="block text-lp-muted-fg tabular-nums">{form.contactNumber && `+91 ${form.contactNumber}`}</span>
                          <span className="block text-lp-muted-fg">{[form.city, form.pincode].filter(Boolean).join(' ')}</span>
                        </ReviewBlock>
                        <ReviewBlock title="Processes" onEdit={() => goTo(1)}>
                          <span className="block">
                            {form.capabilities.map((c) => (c === 'Other' && form.otherCapability ? form.otherCapability : c)).join(', ') || '—'}
                          </span>
                          <span className="block text-lp-muted-fg">
                            {REVENUE_OPTIONS.find((o) => o.value === form.monthlyRevenue)?.label}
                          </span>
                        </ReviewBlock>
                        <ReviewBlock title="Sign in" onEdit={() => goTo(2)}>
                          <span className="block break-all">{form.email || '—'}</span>
                          <span className="block text-lp-muted-fg">Password set</span>
                        </ReviewBlock>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-4">
                          <p className="title-4 flex items-center gap-2">
                            <ShieldCheck aria-hidden="true" className="size-5 text-lp-primary" weight="duotone" />
                            Confidentiality and NDA agreement
                          </p>
                          <Link href="/nda-policy" target="_blank" className="caption-1 rounded text-lp-primary underline-offset-4 hover:underline">
                            Full NDA policy
                          </Link>
                        </div>
                        <div tabIndex={0} aria-label="Agreement text" className="body-6 mt-3 max-h-40 overflow-y-auto whitespace-pre-line rounded-xl border border-lp-border bg-lp-card p-4 text-lp-fg/80 focus:outline-none focus-visible:outline-2 focus-visible:outline-lp-primary">
                          {NDA_AGREEMENT_TEXT}
                        </div>
                      </div>

                      <div>
                        <label className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors duration-300 ease-lp', form.ndaAgreed ? 'border-lp-primary bg-lp-primary/5' : showError('ndaAgreed') ? 'border-lp-destructive' : 'border-lp-border hover:border-lp-fg/30')}>
                          <input
                            id="ndaAgreed"
                            type="checkbox"
                            checked={form.ndaAgreed}
                            onChange={(e) => {
                              markTouched('ndaAgreed');
                              setField('ndaAgreed', e.target.checked);
                            }}
                            aria-invalid={!!showError('ndaAgreed')}
                            aria-describedby={showError('ndaAgreed') ? 'ndaAgreed-error' : undefined}
                            className="mt-0.5 size-4 shrink-0 accent-[oklch(var(--lp-primary))]"
                          />
                          <span className="caption-2">
                            I agree to the Confidentiality and NDA Agreement on behalf of {form.companyName.trim() || 'my company'}. I will keep every
                            customer design, drawing and price private.
                          </span>
                        </label>
                        {showError('ndaAgreed') && <FieldError id="ndaAgreed-error">{errors.ndaAgreed}</FieldError>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-lp-border p-6 sm:flex-row sm:items-center sm:justify-between md:px-8">
                  {activeStepIndex > 0 ? (
                    <button type="button" onClick={handlePrevStep} disabled={isSubmitting} className={cn(buttonClass('secondary'), 'disabled:opacity-60')}>
                      <ArrowLeft aria-hidden="true" className="size-4" weight="bold" />
                      Back
                    </button>
                  ) : (
                    <p className="caption-5 text-lp-muted-fg">Four short steps, then we review your shop.</p>
                  )}
                  <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={cn(buttonClass('primary'), 'disabled:opacity-60')}>
                    {isSubmitting ? (
                      <>
                        <CircleNotch aria-hidden="true" className="size-4 animate-spin" weight="bold" />
                        Sending application
                      </>
                    ) : isLastStep ? (
                      <>
                        Submit application
                        <SealCheck aria-hidden="true" className="size-4" weight="bold" />
                      </>
                    ) : (
                      <>
                        Continue to {ONBOARDING_STEPS[activeStepIndex + 1].label.toLowerCase()}
                        <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          <HelpLine title="Questions about joining?" className="mt-6" />
        </main>
      </div>
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Field({
  id,
  label,
  hint,
  optional,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="title-4 block">
        {label}
        {optional && <span className="caption-5 ml-1 text-lp-muted-fg">· optional</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error ? (
        <FieldError id={`${id}-error`}>{error}</FieldError>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="caption-5 mt-2 text-lp-muted-fg">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="caption-4 mt-2 flex items-center gap-1 text-lp-destructive">
      <WarningCircle aria-hidden="true" className="size-4 shrink-0" weight="fill" />
      {children}
    </p>
  );
}

function PasswordField({
  id,
  value,
  show,
  invalid,
  onToggle,
  onBlur,
  onChange,
}: {
  id: string;
  value: string;
  show: boolean;
  invalid: boolean;
  onToggle: () => void;
  onBlur: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete="new-password"
        value={value}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        className={cn(fieldClass(invalid), 'pr-11')}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
        aria-pressed={show}
        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-lp-muted-fg transition-colors duration-300 ease-lp hover:bg-lp-muted hover:text-lp-fg"
      >
        {show ? <EyeSlash aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
}

function Requirement({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={cn('caption-2 flex items-center gap-2 transition-colors duration-300 ease-lp', ok ? 'text-lp-fg' : 'text-lp-muted-fg')}>
      <span className={cn('flex size-5 items-center justify-center rounded-full border transition-colors duration-300 ease-lp', ok ? 'border-lp-primary bg-lp-primary text-lp-primary-fg' : 'border-lp-border')}>
        {ok && <Check aria-hidden="true" className="size-3" weight="bold" />}
      </span>
      {children}
      <span className="sr-only">{ok ? '(done)' : '(not yet)'}</span>
    </li>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-lp-border bg-lp-card p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="lp-mono text-lp-muted-fg">{title}</p>
        <button type="button" onClick={onEdit} className="caption-4 flex items-center gap-1 rounded-full px-2 py-1 text-lp-primary transition-colors duration-300 ease-lp hover:bg-lp-primary/10">
          <PencilSimple aria-hidden="true" className="size-3.5" weight="bold" />
          Edit<span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </div>
      <div className="caption-2 mt-2 space-y-1">{children}</div>
    </div>
  );
}

function SubmittedCard({ email }: { email: string }) {
  return (
    <div className="lp-hero-in overflow-hidden rounded-3xl border border-lp-border bg-lp-bg">
      <div className="lp-blueprint lp-marks relative p-8 text-lp-primary-fg md:p-10">
        <span className="flex size-12 items-center justify-center rounded-full bg-lp-primary-fg text-lp-primary">
          <SealCheck aria-hidden="true" className="size-7" weight="fill" />
        </span>
        <h1 className="heading-4 mt-6">Application received</h1>
        <p className="body-6 mt-2 max-w-[520px] text-lp-primary-fg/85">
          Thanks for applying to the MechMaster network. We sent a verification link to{' '}
          <span className="font-medium text-lp-primary-fg">{email || 'your email'}</span>. Open it to activate your account.
        </p>
      </div>
      <div className="p-8 md:p-10">
        <p className="lp-mono text-lp-muted-fg">What happens next</p>
        <StepList className="mt-4" steps={JOIN_STEPS.slice(1)} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/login?tab=login" className={buttonClass('primary')}>
            Go to sign in
            <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
          </Link>
          <Link href="/" className={buttonClass('secondary')}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
