'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Check, Loader2, FileText, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { V2Shell } from '@/components/V2Shell';
import { Reveal, Tag } from '@/components/home/primitives';

const inputCls =
  'h-12 border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm';
const inputErrorCls =
  'h-12 bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 rounded-sm text-sm border-red-400 focus:border-red-500 focus:ring-red-100';

function ConsultationPageContent() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; message?: string }>({});
  const { toast } = useToast();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(profileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login?tab=register&redirect=/consultation');
    }
  }, [user, isUserLoading, router]);

  const prefilledRef = searchParams.get('ref') || '';
  const prefilledMaterial = searchParams.get('material') || '';
  const prefilledProcess = searchParams.get('process') || '';
  const prefilledQty = searchParams.get('qty') || '';
  const prefilledEstimate = searchParams.get('estimate') || '';

  const defaultMessage = prefilledRef
    ? `I have a pending quote (Ref: ${prefilledRef}) for ${prefilledQty} pcs of ${prefilledMaterial} via ${prefilledProcess}.\nThe estimated cost is ${prefilledEstimate}.\n\nI would like to discuss next steps with an expert regarding:`
    : '';

  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return 'Enter a valid phone number (10 to 15 digits).';
    }
    return '';
  };

  const validateMessage = (value: string) => {
    const cleaned = value.replace(/\s+/g, ' ').trim();
    if (cleaned.length < 20) {
      return 'Please describe your issue in at least 20 characters.';
    }
    return '';
  };

  async function handleConsultationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const phone = (formData.get('phone') as string) || '';
    const message = (formData.get('message') as string) || '';
    const phoneError = validatePhone(phone);
    const messageError = validateMessage(message);

    if (phoneError || messageError) {
      setFieldErrors({
        ...(phoneError ? { phone: phoneError } : {}),
        ...(messageError ? { message: messageError } : {}),
      });
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const requestData = {
      name: formData.get('name') as string,
      phone,
      email: formData.get('email') as string,
      message: message.trim(),
      quoteRef: prefilledRef,
      material: prefilledMaterial,
      process: prefilledProcess,
      quantity: prefilledQty,
      estimate: prefilledEstimate,
    };

    try {
      const res = await fetch('/api/v1/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      setIsSubmitted(true);
      toast({
        title: 'Request Sent!',
        description: 'Our experts will contact you within 24 hours.',
      });
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: 'Something went wrong while sending your request.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
        <Reveal>
          <Tag>Expert Consultation</Tag>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mt-5 text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
            Talk to a <span className="font-lp-serif italic">Manufacturing Expert</span>
          </h1>
        </Reveal>
        <Reveal delay={140}>
          <p className="mt-4 max-w-xl text-sm text-lp-muted-fg">
            Get your design reviewed, value-engineered, or fully optimised by our in-house
            manufacturing experts.
          </p>
        </Reveal>

        <div className="mt-14 max-w-xl mx-auto">
          {isSubmitted ? (
            <Reveal>
              <div className="py-16 flex flex-col items-center justify-center text-center border border-lp-border bg-lp-bg">
                <div className="flex size-16 items-center justify-center bg-emerald-50 text-emerald-500 mb-4">
                  <Check className="size-7" />
                </div>
                <p className="text-lg font-medium">Request Received!</p>
                <p className="mt-2 text-sm text-lp-muted-fg max-w-sm px-8">
                  One of our engineers will reach out to you within the next 24 hours to discuss your
                  project.
                </p>
              </div>
            </Reveal>
          ) : isUserLoading || !user ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <Loader2 className="size-8 text-lp-primary animate-spin mb-4" />
              <p className="lp-label-mono text-lp-muted-fg">Verifying Session...</p>
            </div>
          ) : (
            <Reveal>
              <div className="border border-lp-border bg-lp-bg p-6 sm:p-10">
                <form onSubmit={handleConsultationSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="lp-label-mono text-lp-primary">
                        Name
                      </label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={user?.displayName || ''}
                        required
                        readOnly
                        className={`${inputCls} cursor-not-allowed opacity-70`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="lp-label-mono text-lp-primary">
                        Phone
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={profile?.phone || ''}
                        required
                        onChange={(e) => {
                          if (!fieldErrors.phone) return;
                          const nextError = validatePhone(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, phone: nextError || undefined }));
                        }}
                        onBlur={(e) => {
                          const nextError = validatePhone(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, phone: nextError || undefined }));
                        }}
                        className={fieldErrors.phone ? inputErrorCls : inputCls}
                      />
                      {fieldErrors.phone && (
                        <p className="text-[10px] text-red-500 font-medium">{fieldErrors.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="lp-label-mono text-lp-primary">
                      Work Email
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={user?.email || ''}
                      required
                      readOnly
                      className={`${inputCls} cursor-not-allowed opacity-70`}
                    />
                  </div>

                  {prefilledRef && (
                    <div className="p-4 bg-lp-accent border border-lp-border flex items-start gap-3">
                      <FileText className="size-5 text-lp-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Quote {prefilledRef} Attached
                        </p>
                        <p className="text-xs text-lp-muted-fg leading-relaxed">
                          Our engineers will have access to your estimated pricing, material choices,
                          and quantities for faster context.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="message" className="lp-label-mono text-lp-primary">
                      Project Brief & DFM Questions
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      defaultValue={defaultMessage}
                      required
                      minLength={20}
                      onChange={(e) => {
                        if (!fieldErrors.message) return;
                        const nextError = validateMessage(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, message: nextError || undefined }));
                      }}
                      onBlur={(e) => {
                        const nextError = validateMessage(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, message: nextError || undefined }));
                      }}
                      placeholder="Describe your design, material, quantity, and any technical questions..."
                      className={`min-h-[140px] resize-none text-sm rounded-sm ${
                        fieldErrors.message
                          ? 'border-red-400 bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-red-500 focus:ring-red-100'
                          : 'border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10'
                      }`}
                    />
                    {fieldErrors.message && (
                      <p className="text-[10px] text-red-500 font-medium">{fieldErrors.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="lp-label-mono w-full h-14 bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm mt-4 transition-all active:scale-[0.98]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        Request Expert Consultation
                        <ArrowRight className="ml-2 size-4" />
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ConsultationPage() {
  return (
    <V2Shell>
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="size-8 text-lp-primary animate-spin" />
          </div>
        }
      >
        <ConsultationPageContent />
      </Suspense>
    </V2Shell>
  );
}
