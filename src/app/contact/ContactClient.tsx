'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import { BackToHomeBar } from '@/components/BackToHomeBar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Check,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  Send,
} from 'lucide-react';
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
      toast({
        title: 'Message Sent!',
        description: "We'll get back to you within 24 hours.",
      });
    } catch (err: any) {
      toast({
        title: 'Something went wrong',
        description: err.message || 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-[#2F5FA7]/30 relative overflow-hidden">
      {/* Background Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(47, 95, 167, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(47, 95, 167, 0.04) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#2F5FA7]/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <LandingNav />
        <BackToHomeBar className="pb-0" />

        {/* Main Content */}
        <div className="container mx-auto px-4 pt-8 pb-20">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-12 md:mb-16">
              <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.3em] text-[#2F5FA7] mb-3">
                CONTACT US
              </p>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0F172A] mb-4 leading-tight">
                Get in touch with our team
              </h1>
              <p className="text-[#64748B] text-sm md:text-base max-w-xl font-medium leading-relaxed">
                Have a question about our services, need a custom quote, or want to discuss your
                project? Fill out the form below and our team will get back to you shortly.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-16">
              {/* Left Column — Form */}
              <div className="lg:col-span-3">
                {isSubmitted ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-slate-100 shadow-[0_20px_50px_rgba(47,95,167,0.08)]">
                    <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                      <Check className="w-9 h-9 text-emerald-500" />
                    </div>
                    <p className="text-[#1E3A66] font-bold text-xl mb-2">Message Received!</p>
                    <p className="text-[#64748B] text-sm max-w-sm font-medium px-8 leading-relaxed">
                      Thank you for reaching out. Our team will respond within 24 hours. Check your
                      email for confirmation.
                    </p>
                    <Link href="/">
                      <Button className="mt-8 bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-blue-900/10 group">
                        Back to Home{' '}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 p-6 sm:p-10 rounded-3xl shadow-[0_20px_50px_rgba(47,95,167,0.08)] relative overflow-hidden">
                    {/* Subtle corner accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#2F5FA7]/[0.03] rounded-bl-[80px] pointer-events-none" />

                    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label
                            htmlFor="firstName"
                            className="text-[11px] font-bold text-[#2F5FA7] uppercase tracking-widest ml-1"
                          >
                            First name
                          </label>
                          <Input
                            id="firstName"
                            name="firstName"
                            required
                            placeholder="John"
                            className="bg-slate-50 border-slate-200 text-[#1E3A66] placeholder:text-slate-400 focus:border-[#2F5FA7]/50 focus:ring-[#2F5FA7]/20 h-12 text-sm rounded-xl transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="lastName"
                            className="text-[11px] font-bold text-[#2F5FA7] uppercase tracking-widest ml-1"
                          >
                            Last name
                          </label>
                          <Input
                            id="lastName"
                            name="lastName"
                            required
                            placeholder="Doe"
                            className="bg-slate-50 border-slate-200 text-[#1E3A66] placeholder:text-slate-400 focus:border-[#2F5FA7]/50 focus:ring-[#2F5FA7]/20 h-12 text-sm rounded-xl transition-all font-medium"
                          />
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
                          required
                          placeholder="john@company.com"
                          className="bg-slate-50 border-slate-200 text-[#1E3A66] placeholder:text-slate-400 focus:border-[#2F5FA7]/50 focus:ring-[#2F5FA7]/20 h-12 text-sm rounded-xl transition-all font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label
                            htmlFor="phone"
                            className="text-[11px] font-bold text-[#2F5FA7] uppercase tracking-widest ml-1"
                          >
                            Phone{' '}
                            <span className="text-slate-400 normal-case tracking-normal">
                              (optional)
                            </span>
                          </label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            placeholder="+91 98765 43210"
                            className="bg-slate-50 border-slate-200 text-[#1E3A66] placeholder:text-slate-400 focus:border-[#2F5FA7]/50 focus:ring-[#2F5FA7]/20 h-12 text-sm rounded-xl transition-all font-medium"
                          />
                        </div>
                        <div className="space-y-2">
                          <label
                            htmlFor="company"
                            className="text-[11px] font-bold text-[#2F5FA7] uppercase tracking-widest ml-1"
                          >
                            Company{' '}
                            <span className="text-slate-400 normal-case tracking-normal">
                              (optional)
                            </span>
                          </label>
                          <Input
                            id="company"
                            name="company"
                            placeholder="Acme Inc."
                            className="bg-slate-50 border-slate-200 text-[#1E3A66] placeholder:text-slate-400 focus:border-[#2F5FA7]/50 focus:ring-[#2F5FA7]/20 h-12 text-sm rounded-xl transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="message"
                          className="text-[11px] font-bold text-[#2F5FA7] uppercase tracking-widest ml-1"
                        >
                          Message
                        </label>
                        <Textarea
                          id="message"
                          name="message"
                          required
                          minLength={10}
                          placeholder="Tell us about your project, requirements, or any questions you have..."
                          className="bg-slate-50 border-slate-200 text-[#1E3A66] placeholder:text-slate-400 focus:border-[#2F5FA7]/50 focus:ring-[#2F5FA7]/20 min-h-[140px] text-sm rounded-xl resize-none transition-all font-medium"
                        />
                      </div>

                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                        By submitting this form, you agree to our{' '}
                        <Link
                          href="/privacy-policy"
                          className="text-[#2F5FA7] underline underline-offset-2 hover:text-[#1E3A66]"
                        >
                          Privacy Policy
                        </Link>
                        . We&apos;ll never share your information with third parties.
                      </p>

                      <Button
                        type="submit"
                        className="w-full h-14 font-bold text-base bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-xl shadow-lg shadow-blue-900/10 transition-all active:scale-[0.98] group"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            Send Message{' '}
                            <Send className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                )}
              </div>

              {/* Right Column — Support Info */}
              <div className="lg:col-span-2 space-y-8">
                {/* Direct Support */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h2 className="text-lg font-bold text-[#0F172A] mb-1 tracking-tight">
                    Direct Support
                  </h2>
                  <p className="text-sm text-[#64748B] font-medium mb-6 leading-relaxed">
                    Prefer to reach out directly? Use any of the channels below.
                  </p>

                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Mail className="w-4.5 h-4.5 text-[#2F5FA7]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Email
                        </p>
                        <a
                          href="mailto:outreach@mechhub.in"
                          className="text-sm font-bold text-[#1E3A66] hover:text-[#2F5FA7] transition-colors"
                        >
                          outreach@mechhub.in
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <Phone className="w-4.5 h-4.5 text-[#2F5FA7]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Phone
                        </p>
                        <a
                          href="tel:+919607043079"
                          className="text-sm font-bold text-[#1E3A66] hover:text-[#2F5FA7] transition-colors"
                        >
                          +91 9607043079
                        </a>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          Mon–Sun, 10AM–8PM IST
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                        <MapPin className="w-4.5 h-4.5 text-[#2F5FA7]" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                          Office
                        </p>
                        <p className="text-sm font-bold text-[#1E3A66] leading-relaxed">
                          Synchubb Innovations Pvt Ltd
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Response Time */}
                <div className="bg-gradient-to-br from-[#1E3A66] to-[#2F5FA7] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none -translate-y-10 translate-x-10" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mb-5">
                      <Clock className="w-5 h-5 text-cyan-300" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 tracking-tight">Response Time</h3>
                    <p className="text-white/70 text-sm font-medium leading-relaxed">
                      Our team typically responds within{' '}
                      <span className="text-cyan-300 font-bold">24 hours</span> on working days. For
                      urgent manufacturing queries, call us directly.
                    </p>
                  </div>
                </div>

                {/* FAQ hint */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <h3 className="text-base font-bold text-[#0F172A] mb-3 tracking-tight">
                    Common Questions
                  </h3>
                  <div className="space-y-3">
                    {[
                      'What file formats do you accept?',
                      'What are your minimum order quantities?',
                      'How do I track my order?',
                    ].map((q) => (
                      <div key={q} className="flex items-center gap-3 group">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#2F5FA7]/30 group-hover:bg-[#2F5FA7] transition-colors shrink-0" />
                        <p className="text-sm text-[#64748B] font-medium group-hover:text-[#1E3A66] transition-colors">
                          {q}
                        </p>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/about"
                    className="inline-flex items-center gap-2 mt-5 text-xs font-bold text-[#2F5FA7] uppercase tracking-widest hover:text-[#1E3A66] transition-colors group"
                  >
                    Learn More{' '}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
