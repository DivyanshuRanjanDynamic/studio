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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  VENDOR_CAPABILITIES,
  NDA_AGREEMENT_TEXT,
  indianPhoneRegex,
  gstRegex,
} from '@/lib/vendor-onboarding';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface FormState {
  companyName: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  workshopAddress: string;
  gstNumber: string;
  capabilities: string[];
  otherCapability: string;
  commissionStructure: string;
  monthlyRevenue: string;
  paymentTerms: string;
  ndaAgreed: boolean;
  password: string;
  confirmPassword: string;
}

const INITIAL_STATE: FormState = {
  companyName: '',
  ownerName: '',
  contactNumber: '',
  email: '',
  workshopAddress: '',
  gstNumber: '',
  capabilities: [],
  otherCapability: '',
  commissionStructure: '',
  monthlyRevenue: '',
  paymentTerms: '',
  ndaAgreed: false,
  password: '',
  confirmPassword: '',
};

const SECTIONS = [
  'Company Details',
  'Manufacturing Capabilities',
  'Commission Structure',
  'Monthly Revenue',
  'Payment Terms',
  'Confidentiality & NDA',
];

export default function VendorOnboardingPage() {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};

    if (!form.companyName.trim()) next.companyName = 'Company name is required.';
    if (!form.ownerName.trim()) next.ownerName = 'Owner name is required.';

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

    if (!form.workshopAddress.trim()) {
      next.workshopAddress = 'Workshop address is required.';
    }

    if (form.gstNumber.trim() && !gstRegex.test(form.gstNumber.trim())) {
      next.gstNumber = 'Enter a valid GST number.';
    }

    if (form.capabilities.length === 0) {
      next.capabilities = 'Select at least one capability.';
    }

    if (form.capabilities.includes('Other') && !form.otherCapability.trim()) {
      next.otherCapability = 'Please specify the other capability.';
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

  const requiredReady =
    !errors.companyName &&
    !errors.ownerName &&
    !errors.contactNumber &&
    !errors.email &&
    !errors.workshopAddress &&
    !errors.capabilities &&
    !errors.otherCapability &&
    !errors.password &&
    !errors.confirmPassword &&
    !errors.ndaAgreed;

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
      workshopAddress: true,
      gstNumber: true,
      capabilities: true,
      otherCapability: true,
      password: true,
      confirmPassword: true,
      ndaAgreed: true,
    });

    if (!requiredReady) {
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
          workshopAddress: form.workshopAddress.trim(),
          gstNumber: form.gstNumber.trim() || undefined,
          capabilities: form.capabilities,
          otherCapability: form.otherCapability.trim() || undefined,
          commissionStructure: form.commissionStructure.trim() || undefined,
          monthlyRevenue: form.monthlyRevenue || undefined,
          paymentTerms: form.paymentTerms.trim() || undefined,
          ndaAgreed: form.ndaAgreed,
          password: form.password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
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

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <header className="rounded-3xl border border-blue-100 bg-white p-6 md:p-8 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a5fad]">
              Vendor Onboarding
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-[#1a3766]">
              Onboard as Vendor
            </h1>
            <p className="mt-3 max-w-3xl text-sm md:text-base text-slate-600">
              Submit your workshop profile to become a MechMaster on MechHub. Required fields are
              validated before submission.
            </p>
          </header>

          <Card className="border-blue-100 bg-white">
            <CardHeader>
              <CardTitle className="text-[#1a3766]">Progress</CardTitle>
              <CardDescription>Complete all 6 sections to submit your application.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SECTIONS.map((section, index) => {
                const done = index < 2 ? requiredReady : submitted;
                return (
                  <div
                    key={section}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
                  >
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300" />
                    )}
                    <span className="text-sm font-semibold text-slate-700">
                      {index + 1}. {section}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {submitted ? (
            <Card className="border-emerald-200 bg-emerald-50">
              <CardContent className="p-8 text-center space-y-4">
                <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
                <h2 className="text-2xl font-bold text-emerald-900">Application Submitted</h2>
                <p className="text-slate-700 max-w-2xl mx-auto">
                  Your application has been submitted. MechHub will review and contact you.
                </p>
                <p className="text-slate-700 max-w-2xl mx-auto">
                  We also sent a verification email to activate your new vendor account (role:
                  <strong> vendor_pending</strong>).
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <Button asChild className="bg-[#1a5fad] hover:bg-[#174f92]">
                    <Link href="/login">Go to Login</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Back to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="border-blue-100 bg-white">
                <CardHeader>
                  <CardTitle className="text-[#1a3766]">
                    1. Company Details / நிருவன விவரம்
                  </CardTitle>
                  <CardDescription>All fields in this section are required unless marked optional.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={form.companyName}
                      onBlur={() => markTouched('companyName')}
                      onChange={(e) => setField('companyName', e.target.value)}
                    />
                    {showError('companyName') && <p className="text-xs text-red-600">{errors.companyName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                      id="ownerName"
                      value={form.ownerName}
                      onBlur={() => markTouched('ownerName')}
                      onChange={(e) => setField('ownerName', e.target.value)}
                    />
                    {showError('ownerName') && <p className="text-xs text-red-600">{errors.ownerName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                      id="contactNumber"
                      inputMode="numeric"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={form.contactNumber}
                      onBlur={() => markTouched('contactNumber')}
                      onChange={(e) => setField('contactNumber', e.target.value.replace(/\D/g, ''))}
                    />
                    {showError('contactNumber') && <p className="text-xs text-red-600">{errors.contactNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onBlur={() => markTouched('email')}
                      onChange={(e) => setField('email', e.target.value)}
                    />
                    {showError('email') && <p className="text-xs text-red-600">{errors.email}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="workshopAddress">Workshop Address</Label>
                    <Textarea
                      id="workshopAddress"
                      rows={4}
                      value={form.workshopAddress}
                      onBlur={() => markTouched('workshopAddress')}
                      onChange={(e) => setField('workshopAddress', e.target.value)}
                    />
                    {showError('workshopAddress') && (
                      <p className="text-xs text-red-600">{errors.workshopAddress}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number (if any)</Label>
                    <Input
                      id="gstNumber"
                      value={form.gstNumber}
                      onBlur={() => markTouched('gstNumber')}
                      onChange={(e) => setField('gstNumber', e.target.value.toUpperCase())}
                    />
                    {showError('gstNumber') && <p className="text-xs text-red-600">{errors.gstNumber}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Set Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onBlur={() => markTouched('password')}
                      onChange={(e) => setField('password', e.target.value)}
                    />
                    {showError('password') && <p className="text-xs text-red-600">{errors.password}</p>}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onBlur={() => markTouched('confirmPassword')}
                      onChange={(e) => setField('confirmPassword', e.target.value)}
                    />
                    {showError('confirmPassword') && (
                      <p className="text-xs text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-100 bg-white">
                <CardHeader>
                  <CardTitle className="text-[#1a3766]">
                    2. Manufacturing Capabilities / சேவை திறன்
                  </CardTitle>
                  <CardDescription>Select at least one capability.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {VENDOR_CAPABILITIES.map((capability) => (
                      <label
                        key={capability}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium"
                      >
                        <Checkbox
                          checked={form.capabilities.includes(capability)}
                          onCheckedChange={(checked) => {
                            markTouched('capabilities');
                            toggleCapability(capability, checked === true);
                          }}
                        />
                        {capability}
                      </label>
                    ))}
                  </div>
                  {showError('capabilities') && <p className="text-xs text-red-600">{errors.capabilities}</p>}

                  {form.capabilities.includes('Other') && (
                    <div className="space-y-2">
                      <Label htmlFor="otherCapability">Please specify</Label>
                      <Input
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

              <Card className="border-blue-100 bg-white">
                <CardHeader>
                  <CardTitle className="text-[#1a3766]">
                    3. Commission Structure / கமிஷன் விவரம்
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={3}
                    value={form.commissionStructure}
                    onChange={(e) => setField('commissionStructure', e.target.value)}
                    placeholder="Optional"
                  />
                </CardContent>
              </Card>

              <Card className="border-blue-100 bg-white">
                <CardHeader>
                  <CardTitle className="text-[#1a3766]">
                    4. Monthly Revenue / மாதாந்திர வருமானம்
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={form.monthlyRevenue}
                    onValueChange={(value) => setField('monthlyRevenue', value)}
                  >
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

              <Card className="border-blue-100 bg-white">
                <CardHeader>
                  <CardTitle className="text-[#1a3766]">5. Payment Terms / பேமென்ட் விவரம்</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    rows={3}
                    value={form.paymentTerms}
                    onChange={(e) => setField('paymentTerms', e.target.value)}
                    placeholder="Optional"
                  />
                </CardContent>
              </Card>

              <Card className="border-blue-100 bg-white">
                <CardHeader>
                  <CardTitle className="text-[#1a3766]">
                    6. Confidentiality & NDA Agreement / ரகசிய ஒப்பந்தம்
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 whitespace-pre-line">
                    {NDA_AGREEMENT_TEXT}
                  </div>

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

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button
                  type="submit"
                  className="bg-[#1a5fad] hover:bg-[#174f92]"
                  disabled={!requiredReady || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
                <p className="text-xs text-slate-500">
                  Submit is enabled only after required fields, capabilities, and NDA consent are valid.
                </p>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
