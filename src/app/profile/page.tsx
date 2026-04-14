'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { LandingNav } from '@/components/LandingNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import {
  Building2,
  Camera,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  SlidersHorizontal,
  UserIcon,
} from 'lucide-react';
import { getDashboardHrefByRole } from '@/lib/roles';

type ProfileSection = 'personal' | 'organization' | 'security' | 'preferences';

interface ProfileForm {
  fullName: string;
  phone: string;
  teamName: string;
  designation: string;
  location: string;
}

const SECTION_META: Record<ProfileSection, { title: string; subtitle: string }> = {
  personal: {
    title: 'Personal Info',
    subtitle: 'Manage your identity and primary contact details.',
  },
  organization: {
    title: 'Organization',
    subtitle: 'Set your team profile for procurement and quoting workflows.',
  },
  security: {
    title: 'Security',
    subtitle: 'Review account safeguards and protection controls.',
  },
  preferences: {
    title: 'Preferences',
    subtitle: 'Choose notification and experience defaults.',
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [activeSection, setActiveSection] = useState<ProfileSection>('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    fullName: '',
    phone: '',
    teamName: '',
    designation: '',
    location: '',
  });
  const [preferences, setPreferences] = useState({
    emailUpdates: true,
    orderNotifications: true,
    marketingUpdates: false,
  });

  const userProfileRef = useMemoFirebase(
    () => (db && user ? doc(db, 'users', user.uid) : null),
    [db, user?.uid]
  );
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (!profile) return;
    setForm({
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      teamName: profile.teamName || '',
      designation: profile.designation || '',
      location: profile.location || '',
    });
    setPreferences({
      emailUpdates: profile.preferences?.emailUpdates ?? true,
      orderNotifications: profile.preferences?.orderNotifications ?? true,
      marketingUpdates: profile.preferences?.marketingUpdates ?? false,
    });
  }, [profile]);

  const initials = useMemo(() => {
    const source = form.fullName || user?.email || 'U';
    return source
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [form.fullName, user?.email]);
  const role = profile?.role || 'customer';
  const dashboardHref = getDashboardHrefByRole(role);

  const handleFieldChange = (key: keyof ProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const { UserService } = await import('@/services/user.service');
      const result = await UserService.updateProfile(user.uid, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        teamName: form.teamName.trim(),
        designation: form.designation.trim(),
        location: form.location.trim(),
        preferences,
      });

      if (result.success) {
        toast({
          title: 'Profile updated',
          description: 'Your account settings were saved successfully.',
        });
      } else {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      toast({
        title: 'Save failed',
        description: error.message || 'We could not update your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#2F5FA7]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F6F8FC] text-slate-900">
      <LandingNav />

      <main className="container mx-auto px-4 py-8 md:py-10">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2F5FA7] mb-3">
            Account Settings
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            My Profile
          </h1>
          <p className="mt-2 text-sm md:text-base text-slate-600 max-w-2xl">
            Manage identity, organization context, and account preferences in one dedicated space.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-[#2F5FA7] text-white flex items-center justify-center text-2xl font-bold ring-4 ring-blue-50">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {form.fullName || 'Complete your profile'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{profile?.email || user.email}</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                    disabled
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Upload Avatar (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(
                  [
                    { id: 'personal', label: 'Personal Info', icon: UserIcon },
                    { id: 'organization', label: 'Organization', icon: Building2 },
                    { id: 'security', label: 'Security', icon: Shield },
                    { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
                  ] as Array<{ id: ProfileSection; label: string; icon: any }>
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      activeSection === item.id
                        ? 'border-[#2F5FA7] bg-blue-50 text-[#2F5FA7]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                ))}
              </CardContent>
            </Card>
          </aside>

          <section className="space-y-6">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
                      {SECTION_META[activeSection].title}
                    </CardTitle>
                    <CardDescription className="text-sm text-slate-600 mt-1">
                      {SECTION_META[activeSection].subtitle}
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-50 text-[#2F5FA7] border border-blue-100 uppercase tracking-[0.15em] text-[10px] font-bold">
                    Profile
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {activeSection === 'personal' && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                        Full Name
                      </Label>
                      <Input
                        value={form.fullName}
                        onChange={(e) => handleFieldChange('fullName', e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="h-11 bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                        Phone
                      </Label>
                      <Input
                        value={form.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                        className="h-11 bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                        Email Address
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 h-11 bg-slate-100 border border-slate-200 rounded-md px-3 flex items-center text-sm text-slate-600">
                          <Mail className="w-4 h-4 mr-2 text-slate-400" />
                          {profile?.email || user.email}
                        </div>
                        <Link href="/contact" className="sm:w-auto">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-11 border-slate-200 hover:bg-slate-50"
                          >
                            Change Email
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'organization' && (
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                        Organization
                      </Label>
                      <Input
                        value={form.teamName}
                        onChange={(e) => handleFieldChange('teamName', e.target.value)}
                        placeholder="Company or institution"
                        className="h-11 bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                        Designation
                      </Label>
                      <Input
                        value={form.designation}
                        onChange={(e) => handleFieldChange('designation', e.target.value)}
                        placeholder="e.g. Founder, Procurement Lead"
                        className="h-11 bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                        Location
                      </Label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          value={form.location}
                          onChange={(e) => handleFieldChange('location', e.target.value)}
                          placeholder="City, State"
                          className="h-11 bg-slate-50 border-slate-200 pl-10"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === 'security' && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Password</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Keep your account protected with a strong password.
                        </p>
                      </div>
                      <Link href="/contact">
                        <Button variant="outline" className="border-slate-200 hover:bg-white">
                          Manage
                        </Button>
                      </Link>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Two-factor authentication
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Add an extra security layer for account sign-ins.
                        </p>
                      </div>
                      <Badge className="bg-amber-50 text-amber-700 border border-amber-100">
                        Coming Soon
                      </Badge>
                    </div>
                  </div>
                )}

                {activeSection === 'preferences' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Order status updates</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Receive alerts when RFQs and shop orders change status.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.orderNotifications}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({ ...prev, orderNotifications: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Platform updates</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Product announcements and feature releases from MechHub.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.emailUpdates}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({ ...prev, emailUpdates: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Marketing emails</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Promotions, offers, and educational campaign emails.
                        </p>
                      </div>
                      <Switch
                        checked={preferences.marketingUpdates}
                        onCheckedChange={(checked) =>
                          setPreferences((prev) => ({ ...prev, marketingUpdates: checked }))
                        }
                      />
                    </div>
                  </div>
                )}

                <Separator />

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-xs text-slate-500">
                    Last updated:{' '}
                    <span className="font-semibold text-slate-700">
                      {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : 'Not set'}
                    </span>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 sm:flex-none border-slate-200"
                      onClick={() => router.push(dashboardHref)}
                    >
                      Back to Dashboard
                    </Button>
                    <Button
                      type="button"
                      className="flex-1 sm:flex-none bg-[#2F5FA7] hover:bg-[#1E3A66]"
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-100">
              <CardContent className="p-5 flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#2F5FA7] mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  Need help with account updates or security controls? Reach out through{' '}
                  <Link href="/contact" className="text-[#2F5FA7] font-semibold hover:underline">
                    support
                  </Link>{' '}
                  and we will assist quickly.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
