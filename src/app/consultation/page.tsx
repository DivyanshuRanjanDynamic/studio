'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LandingNav } from '@/components/LandingNav';
import { BackToHomeBar } from '@/components/BackToHomeBar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useFirestore, setDocumentNonBlocking, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Check, Loader2, FileText, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    if (!db) return;

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
    const id = Math.random().toString(36).substring(2, 11);

    const requestData = {
      id,
      userId: user?.uid || null,
      name: formData.get('name') as string,
      phone,
      email: formData.get('email') as string,
      message: message.trim(),
      quoteRef: prefilledRef,
      material: prefilledMaterial,
      process: prefilledProcess,
      quantity: prefilledQty,
      estimate: prefilledEstimate,
      requestDate: new Date().toISOString(),
    };

    const docRef = doc(db, 'consultationRequests', id);

    try {
      setDocumentNonBlocking(docRef, requestData, { merge: true });

      // Trigger admin notification via internal API
      fetch('/api/v1/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'admin_consultation_booked',
          customerName: requestData.name,
          customerEmail: requestData.email,
          customerPhone: requestData.phone,
          message: requestData.message,
          quoteRef: requestData.quoteRef || undefined,
        }),
      }).catch((err) => console.error('Failed to trigger consultation notification:', err));

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
    <div className="pb-20 pt-3 px-4 container mx-auto">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1E3A66] mb-2 tracking-tight">
          Talk to a Manufacturing Expert
        </h1>
        <p className="text-[#64748B] mb-8 text-base font-medium">
          Get your design reviewed, value-engineered, or fully optimised by our in-house
          manufacturing experts.
        </p>

        {isSubmitted ? (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
              <Check className="w-7 h-7 text-emerald-500" />
            </div>
            <p className="text-[#1E3A66] font-bold text-lg mb-2">Request Received!</p>
            <p className="text-[#64748B] text-sm max-w-sm font-medium px-8">
              One of our engineers will reach out to you within the next 24 hours to discuss your
              project.
            </p>
          </div>
        ) : isUserLoading || !user ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-[#2F5FA7] animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
              Verifying Session...
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 p-6 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(47,95,167,0.1)] relative overflow-hidden">
            <form onSubmit={handleConsultationSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-[11px] font-bold text-[#2F5FA7] uppercase tracking-widest ml-1"
                  >
                    Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={user?.displayName || ''}
                    required
                    readOnly
                    className="bg-slate-100 border-slate-200 text-[#1E3A66] placeholder:text-slate-400 h-12 text-sm rounded-xl transition-all font-medium cursor-not-allowed opacity-90"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="text-[11px] font-bold text-[#2F5FA7] uppercase tracking-widest ml-1"
                  >
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
                    className={`bg-slate-50 text-[#1E3A66] placeholder:text-slate-400 h-12 text-sm rounded-xl transition-all font-medium ${
                      fieldErrors.phone
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-slate-200 focus:border-[#2F5FA7]/50 focus:ring-[#2F5FA7]/20'
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-[10px] text-red-600 font-bold tracking-wide">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-[11px] font-bold text-[#2F5FA7] uppercase tracking-widest ml-1"
                >
                  Work Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user?.email || ''}
                  required
                  readOnly
                  className="bg-slate-100 border-slate-200 text-[#1E3A66] placeholder:text-slate-400 h-12 text-sm rounded-xl transition-all font-medium cursor-not-allowed opacity-90"
                />
              </div>

              {prefilledRef && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3 shadow-inner">
                  <FileText className="w-5 h-5 text-[#2F5FA7] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#1E3A66] mb-1">
                      Quote {prefilledRef} Attached
                    </p>
                    <p className="text-xs text-[#64748B] font-medium leading-relaxed">
                      Our engineers will have access to your estimated pricing, material choices,
                      and quantities for faster context.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-[11px] font-bold text-[#2F5FA7] uppercase tracking-widest ml-1"
                >
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
                  className={`bg-slate-50 text-[#1E3A66] placeholder:text-slate-400 min-h-[140px] text-sm rounded-xl resize-none transition-all font-medium ${
                    fieldErrors.message
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-200 focus:border-[#2F5FA7]/50 focus:ring-[#2F5FA7]/20'
                  }`}
                />
                {fieldErrors.message && (
                  <p className="text-[10px] text-red-600 font-bold tracking-wide">
                    {fieldErrors.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-14 font-bold text-base bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-xl mt-4 shadow-lg shadow-blue-900/10 transition-all active:scale-[0.98]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Request Expert Consultation'
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#2F5FA7]/30 relative overflow-hidden">
      {/* Background Grid & Glows */}
      <div
        className="absolute inset-0 bg-[#F8FAFC]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(47, 95, 167, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(47, 95, 167, 0.05) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2F5FA7]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <LandingNav />
        <BackToHomeBar className="pt-8 pb-0" />

        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center pt-24">
              <Loader2 className="w-8 h-8 text-[#2F5FA7] animate-spin" />
            </div>
          }
        >
          <ConsultationPageContent />
        </Suspense>
      </div>
    </div>
  );
}
