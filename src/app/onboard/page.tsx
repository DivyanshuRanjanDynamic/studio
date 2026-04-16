'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LandingNav } from '@/components/LandingNav';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  VENDOR_CAPABILITIES,
  NDA_AGREEMENT_TEXT,
  indianPhoneRegex,
  gstRegex,
} from '@/lib/vendor-onboarding';
import { ArrowLeft, CheckCircle2, Circle, Loader2, Eye, EyeOff } from 'lucide-react';

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

const SECTIONS = [
  'Company Details',
  'Manufacturing Capabilities',
  'Monthly Revenue',
  'Confidentiality & NDA',
];

const ONBOARDING_STEPS = [
  { id: 'business', label: 'Business Profile' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'security', label: 'Security' },
  { id: 'compliance', label: 'Compliance' },
];

export default function VendorOnboardingPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};

    if (!form.companyName.trim()) {
      next.companyName = 'Company name is required.';
    } else if (form.companyName.trim().length < 2) {
      next.companyName = 'Company name must be at least 2 characters.';
    }

    if (!form.ownerName.trim()) {
      next.ownerName = 'Owner name is required.';
    } else if (form.ownerName.trim().length < 2) {
      next.ownerName = 'Owner name must be at least 2 characters.';
    }

    if (!form.contactNumber.trim()) {
      next.contactNumber = 'Contact number is required.';
    } else if (!indianPhoneRegex.test(form.contactNumber.trim())) {
      next.contactNumber = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (!form.email.trim()) {
      next.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'Enter a valid email address.';
    }

    if (!form.location.trim()) {
      next.location = 'Exact location is required.';
    } else if (form.location.trim().length < 3) {
      next.location = 'Location must be at least 3 characters.';
    }

    if (!form.city.trim()) {
      next.city = 'City is required.';
    } else if (form.city.trim().length < 2) {
      next.city = 'City must be at least 2 characters.';
    }

    if (!form.pincode.trim()) {
      next.pincode = 'Pincode is required.';
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      next.pincode = 'Enter a valid 6-digit pincode.';
    }

    if (form.gstNumber.trim() && !gstRegex.test(form.gstNumber.trim())) {
      next.gstNumber = 'Enter a valid GST number.';
    }

    if (form.capabilities.length === 0) {
      next.capabilities = 'Select at least one capability.';
    }

    if (form.capabilities.includes('Other')) {
      if (!form.otherCapability.trim()) {
        next.otherCapability = 'Please specify the other capability.';
      } else if (form.otherCapability.trim().length < 2) {
        next.otherCapability = 'Other capability must be at least 2 characters.';
      }
    }

    if (!form.password) {
      next.password = 'Password is required.';
    } else if (form.password.length < 8) {
      next.password = 'Password must be at least 8 characters.';
    }

    if (!form.confirmPassword) {
      next.confirmPassword = 'Please confirm your password.';
    } else if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Passwords do not match.';
    }

    if (!form.ndaAgreed) {
      next.ndaAgreed = 'You must agree to continue.';
    }

    return next;
  }, [form]);

  const stepStatus = useMemo(() => {
    return {
      business: !errors.companyName && !errors.ownerName && !errors.contactNumber && !errors.email && !errors.location && !errors.city && !errors.pincode,
      capabilities: !errors.capabilities && !errors.otherCapability,
      security: !errors.password && !errors.confirmPassword && form.password.length >= 8,
      compliance: form.ndaAgreed,
    };
  }, [errors, form.ndaAgreed, form.password, form.confirmPassword]);

  const completedCount = Object.values(stepStatus).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / ONBOARDING_STEPS.length) * 100);

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

  const showError = (field: string) => touched[field] && errors[field];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({
      companyName: true,
      ownerName: true,
      contactNumber: true,
      email: true,
      location: true,
      city: true,
      pincode: true,
      gstNumber: true,
      capabilities: true,
      otherCapability: true,
      password: true,
      confirmPassword: true,
      ndaAgreed: true,
    });

    if (!Object.values(stepStatus).every(Boolean)) {
      toast({
        title: 'Fix required fields',
        description: 'Please complete all required sections before submitting.',
        variant: 'destructive',
      });
      return;
    }

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
          throw new Error(`Invalid fields: ${Object.keys(result.details.fieldErrors || {}).join(', ')}`);
        }
        throw new Error(result?.error || 'Failed to submit application');
      }

      setSubmitted(true);
      setForm(INITIAL_STATE);
      setTouched({});
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error?.message || 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <LandingNav />

      <main className="bg-gradient-to-b from-[#7fb2ea] to-[#3f8ce1] py-5 md:py-7">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl rounded-3xl border border-white/50 bg-white/90 p-4 shadow-xl backdrop-blur-sm md:p-6">

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-[#1a5fad]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to dashboard
            </Link>

            {/* Horizontal Progress Tracker */}
            <div className="mb-8 px-2 sm:px-4">
              <div className="flex items-end justify-between mb-6">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#1a5fad]/70">
                    Step-by-Step
                  </p>
                  <h1 className="mt-0.5 text-xl font-bold text-[#1a3766]">Vendor Onboarding</h1>
                </div>
                <div className="text-right flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#1a5fad]">{progressPercent}%</span>
                  <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Complete</span>
                </div>
              </div>

              <div className="relative">
                {/* Background Track */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full" />
                {/* Active Track */}
                <div
                  className="absolute top-1/2 left-0 h-1 bg-[#1a5fad] -translate-y-1/2 rounded-full transition-all duration-700 ease-in-out"
                  style={{ width: `${progressPercent}%` }}
                />

                <div className="relative flex justify-between">
                  {ONBOARDING_STEPS.map((step, idx) => {
                    const isComplete = stepStatus[step.id as keyof typeof stepStatus];
                    const isLast = idx === ONBOARDING_STEPS.length - 1;

                    return (
                      <div key={step.id} className="flex flex-col items-center group">
                        <div className={`
                            relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300
                            ${isComplete
                            ? 'bg-[#1a5fad] border-[#1a5fad] text-white'
                            : 'bg-white border-slate-200 text-slate-400 group-hover:border-[#1a5fad]/30'
                          }
                          `}>
                          {isComplete ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <span className={`
                            mt-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors duration-300
                            ${isComplete ? 'text-[#1a3766]' : 'text-slate-400'}
                          `}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <section className="space-y-4 max-w-3xl mx-auto">

              {submitted ? (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="space-y-4 p-8 text-center">
                    <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
                    <h2 className="text-2xl font-bold text-emerald-900">Application Submitted</h2>
                    <p className="mx-auto max-w-2xl text-slate-700">
                      Your application has been submitted. MechHub will review and contact you.
                    </p>
                    <div className="flex justify-center gap-3 pt-2">
                      <Button asChild className="bg-[#1a5fad] px-8 hover:bg-[#174f92]">
                        <Link href="/">Back to Home</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <Card className="border-blue-50 bg-white/50 shadow-sm">
                    <CardHeader className="py-3 px-4">
                      <CardTitle className="text-sm font-bold text-[#1a3766]">1. Company Details</CardTitle>
                      <CardDescription className="text-[11px]">
                        General business information and workshop location.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 sm:grid-cols-2 px-4 pb-3">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="companyName">Company Name</Label>
                        <Input
                          className="h-9 text-sm"
                          id="companyName"
                          value={form.companyName}
                          onBlur={() => markTouched('companyName')}
                          onChange={(e) => setField('companyName', e.target.value)}
                        />
                        {showError('companyName') && <p className="text-xs text-red-600">{errors.companyName}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="ownerName">Owner Name</Label>
                        <Input
                          className="h-9 text-sm"
                          id="ownerName"
                          value={form.ownerName}
                          onBlur={() => markTouched('ownerName')}
                          onChange={(e) => setField('ownerName', e.target.value)}
                        />
                        {showError('ownerName') && <p className="text-xs text-red-600">{errors.ownerName}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="contactNumber">Contact Number</Label>
                        <Input
                          className="h-9 text-sm"
                          id="contactNumber"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="10-digit mobile number"
                          value={form.contactNumber}
                          onBlur={() => markTouched('contactNumber')}
                          onChange={(e) => setField('contactNumber', e.target.value.replace(/\D/g, ''))}
                        />
                        {showError('contactNumber') && (
                          <p className="text-xs text-red-600">{errors.contactNumber}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="email">Email</Label>
                        <Input
                          className="h-9 text-sm"
                          id="email"
                          type="email"
                          value={form.email}
                          onBlur={() => markTouched('email')}
                          onChange={(e) => setField('email', e.target.value)}
                        />
                        {showError('email') && <p className="text-xs text-red-600">{errors.email}</p>}
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="location">Exact Location</Label>
                        <Input
                          className="h-9 text-sm"
                          id="location"
                          value={form.location}
                          onBlur={() => markTouched('location')}
                          onChange={(e) => setField('location', e.target.value)}
                        />
                        {showError('location') && (
                          <p className="text-xs text-red-600">{errors.location}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="city">City</Label>
                        <Input
                          className="h-9 text-sm"
                          id="city"
                          value={form.city}
                          onBlur={() => markTouched('city')}
                          onChange={(e) => setField('city', e.target.value)}
                        />
                        {showError('city') && <p className="text-xs text-red-600">{errors.city}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="pincode">Pincode</Label>
                        <Input
                          className="h-9 text-sm"
                          id="pincode"
                          inputMode="numeric"
                          maxLength={6}
                          value={form.pincode}
                          onBlur={() => markTouched('pincode')}
                          onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, ''))}
                        />
                        {showError('pincode') && <p className="text-xs text-red-600">{errors.pincode}</p>}
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="gstNumber">GST Number (if any)</Label>
                        <Input
                          className="h-9 text-sm"
                          id="gstNumber"
                          value={form.gstNumber}
                          onBlur={() => markTouched('gstNumber')}
                          onChange={(e) => setField('gstNumber', e.target.value.toUpperCase())}
                        />
                        {showError('gstNumber') && <p className="text-xs text-red-600">{errors.gstNumber}</p>}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-50">
                      <CardTitle className="text-sm font-bold text-[#1a3766]">2. Manufacturing Capabilities</CardTitle>
                      <CardDescription className="text-[11px]">Select your primary production specialties.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal text-slate-700 border-slate-200 hover:bg-slate-50">
                            {form.capabilities.length > 0
                              ? `${form.capabilities.length} capabilities selected`
                              : (
                                <span className="text-slate-500">Select capabilities</span>
                              )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-72" align="start">
                          <div className="max-h-[250px] overflow-y-auto">
                            {VENDOR_CAPABILITIES.map((capability) => (
                              <DropdownMenuCheckboxItem
                                key={capability}
                                checked={form.capabilities.includes(capability)}
                                onCheckedChange={(checked) => {
                                  markTouched('capabilities');
                                  toggleCapability(capability, checked);
                                }}
                              >
                                {capability}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {showError('capabilities') && <p className="text-xs text-red-600">{errors.capabilities}</p>}

                      {form.capabilities.includes('Other') && (
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="otherCapability">Please specify</Label>
                          <Input
                            className="h-9 text-sm"
                            id="otherCapability"
                            value={form.otherCapability}
                            onBlur={() => markTouched('otherCapability')}
                            onChange={(e) => setField('otherCapability', e.target.value)}
                          />
                          {showError('otherCapability') && (
                            <p className="text-xs text-red-600">{errors.otherCapability}</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-50">
                      <CardTitle className="text-sm font-bold text-[#1a3766]">3. Monthly Revenue</CardTitle>
                      <CardDescription className="text-[11px]">
                        This helps us understand your production bandwidth.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Select value={form.monthlyRevenue} onValueChange={(value) => setField('monthlyRevenue', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="below_1L">Below ₹1L</SelectItem>
                          <SelectItem value="1L_5L">₹1L - ₹5L</SelectItem>
                          <SelectItem value="5L_20L">₹5L - ₹20L</SelectItem>
                          <SelectItem value="20L_plus">₹20L+</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-50">
                      <CardTitle className="text-sm font-bold text-[#1a3766]">4. Account Security</CardTitle>
                      <CardDescription className="text-[11px]">
                        Set up login credentials for your portal.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2 p-4">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="password">Set Password</Label>
                        <div className="relative">
                          <Input
                            className="h-9 text-sm pr-9"
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onBlur={() => markTouched('password')}
                            onChange={(e) => setField('password', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {showError('password') && <p className="text-xs text-red-600">{errors.password}</p>}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500" htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            className="h-9 text-sm pr-9"
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={form.confirmPassword}
                            onBlur={() => markTouched('confirmPassword')}
                            onChange={(e) => setField('confirmPassword', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {showError('confirmPassword') && (
                          <p className="text-xs text-red-600">{errors.confirmPassword}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-100 shadow-sm bg-white">
                    <CardHeader className="py-3 px-4 border-b border-slate-50">
                      <CardTitle className="text-sm font-bold text-[#1a3766]">5. Confidentiality & NDA</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-4">
                      <ScrollArea className="h-[120px] w-full rounded-md border border-slate-200 bg-slate-50 p-4 shadow-inner">
                        <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line pr-4 font-mono">
                          {NDA_AGREEMENT_TEXT}
                        </div>
                      </ScrollArea>

                      <label className="flex items-start gap-3 text-sm font-medium text-slate-800">
                        <Checkbox
                          checked={form.ndaAgreed}
                          onCheckedChange={(checked) => {
                            markTouched('ndaAgreed');
                            setField('ndaAgreed', checked === true);
                          }}
                        />
                        I agree to the Confidentiality & NDA Agreement
                      </label>
                      {showError('ndaAgreed') && <p className="text-xs text-red-600">{errors.ndaAgreed}</p>}
                    </CardContent>
                  </Card>

                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <Button
                      type="submit"
                      className="h-11 bg-[#1a5fad] px-10 text-sm font-bold shadow-lg shadow-blue-900/10 hover:bg-[#174f92] hover:shadow-xl transition-all"
                      disabled={!Object.values(stepStatus).every(Boolean) || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        'Continue'
                      )}
                    </Button>
                    <p className="text-xs text-slate-500">
                      Submit is enabled only after required fields, capabilities, and NDA consent are valid.
                    </p>
                  </div>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
