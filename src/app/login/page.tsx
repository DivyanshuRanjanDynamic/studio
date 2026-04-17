'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LandingNav } from '@/components/LandingNav';
import { Loader2, UserPlus, LogIn, ShieldCheck, Factory, User as UserIcon, Clock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { resolveUserFriendlyMessage } from '@/lib/error-mapping';
import { getSafeRedirectPath } from '@/lib/auth-safety';
import { isVendorRole } from '@/lib/roles';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" {...props}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

function LoginPageContent() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [verificationState, setVerificationState] = useState<{
    email: string;
    uid: string;
    name: string;
  } | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [loginRole, setLoginRole] = useState<'customer' | 'vendor'>('customer');
  const [isPendingReview, setIsPendingReview] = useState<{
    email: string;
    name: string;
  } | null>(null);

  // Handle callback query params (verified=true or error=...)
  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === 'true') {
      toast({
        title: 'Email Verified',
        description: 'Your account is now verified. You can sign in.',
        variant: 'default',
      });
      router.replace('/login');
    } else if (error) {
      const errorMessages: Record<string, { title: string; description: string }> = {
        token_unavailable: {
          title: 'Link Already Used',
          description: 'This verification link has already been used. Please sign in with your email and password.',
        },
        invalid_token: {
          title: 'Invalid Link',
          description: 'The verification link is invalid. Please request a new one.',
        },
        expired_token: {
          title: 'Link Expired',
          description: 'This verification link has expired. Please request a new one.',
        },
        verification_failed: {
          title: 'Verification Failed',
          description: 'Something went wrong during verification. Please try again.',
        },
      };
      const msg = errorMessages[error] || {
        title: 'Error',
        description: 'An unexpected error occurred.',
      };
      toast({ variant: 'destructive', title: msg.title, description: msg.description });
      router.replace('/login');
    }
  }, [searchParams, router, toast]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /**
   * CREATE SESSION COOKE
   * Exchanges Firebase ID Token for a server-side HttpOnly cookie.
   */
  const createSession = async (firebaseUser: any) => {
    try {
      const idToken = await firebaseUser.getIdToken(true);
      const res = await fetch('/api/v1/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to establish secure session.');
      }
      return await res.json();
    } catch (error: any) {
      console.error('Session creation failed:', error);
      toast({
        title: 'Session Error',
        description: error.message || 'We could not secure your session. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    async function syncUserAndRedirect() {
      if (user && db) {
        // 1. Enforce email verification — reload to get latest status from server
        await user.reload();
        if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
          setVerificationState({
            email: user.email || '',
            uid: user.uid,
            name: user.displayName || 'Innovator',
          });
          // Note: We no longer signOut(auth) here. 
          // This keeps auth.currentUser available for the 'Resend' functionality.
          return;
        }

        setLoading(true);
        try {
          // 2. Establish Server Session
          const sessionData = await createSession(user);
          if (!sessionData || sessionData.status !== 'success') {
            toast({
              title: sessionData?.message === 'Account not found. Please register manually via the signup form.'
                ? 'Registration Required'
                : 'Authentication Failed',
              description: sessionData?.message || 'We could not establish your secure session. Please try again.',
              variant: 'destructive',
            });
            await signOut(auth);
            setLoading(false);
            return;
          }

          // 3. Flow Normalization (Layer 3)
          // Profile is now synced server-side in /api/v1/auth/session.
          // We use the role and status returned from there directly.
          const { role, accountStatus } = sessionData;

          if (accountStatus === 'suspended') {
            toast({
              title: 'Account Suspended',
              description: 'Please contact support for assistance.',
              variant: 'destructive',
            });
            await signOut(auth);
            await fetch('/api/v1/auth/session', { method: 'DELETE' });
            return;
          }

          // 4. Role-Toggle Validation (Layer 4)
          // Ensure Customers use the Customer toggle and Vendors use the Vendor toggle.
          // ADMINS are allowed via either toggle.
          if (role !== 'admin') {
            if (loginRole === 'customer' && (isVendorRole(role) || role === 'vendor_pending')) {
              toast({
                title: 'Registration Mismatch',
                description: 'You are registered as a MechMaster Partner. Please switch to the Vendor portal to sign in.',
                variant: 'destructive',
              });
              await signOut(auth);
              await fetch('/api/v1/auth/session', { method: 'DELETE' });
              setLoading(false);
              return;
            }

            if (loginRole === 'vendor' && role === 'customer') {
              toast({
                title: 'Registration Mismatch',
                description: 'You are registered as a Customer. Please switch to the Customer hub to sign in.',
                variant: 'destructive',
              });
              await signOut(auth);
              await fetch('/api/v1/auth/session', { method: 'DELETE' });
              setLoading(false);
              return;
            }
          }

          // 5. Redirect based on role
          const redirectPath = getSafeRedirectPath(searchParams.get('redirect'));

          if (role === 'vendor_pending') {
            toast({
              title: 'Application Under Review',
              description: 'Our engineers are currently reviewing your workshop details. We will notify you via email once you are verified.',
            });
            setIsPendingReview({
              email: user.email || '',
              name: user.displayName || 'Partner'
            });
            setLoading(false);
            return;
          }

          if (role === 'admin') {
            router.push('/admin');
          } else if (isVendorRole(role)) {
            router.push('/vendor');
          } else {
            router.push(redirectPath);
          }
        } catch (err) {
          console.error('Error syncing user profile:', err);
        } finally {
          setLoading(false);
        }
      }
    }

    syncUserAndRedirect();
  }, [user, db, router, searchParams]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      // CRITICAL: Reload user to get the latest emailVerified status from the server.
      // The Admin SDK may have verified the email server-side, but the client token
      // still caches the old `emailVerified: false` until explicitly refreshed.
      await userCred.user.reload();
      if (!userCred.user.emailVerified) {
        setVerificationState({
          email: userCred.user.email || '',
          uid: userCred.user.uid,
          name: userCred.user.displayName || 'Innovator',
        });
        setLoading(false);
        return;
      }
    } catch (error: any) {
      setLoading(false);
      const msg = resolveUserFriendlyMessage(error);
      if (msg) {
        toast({
          variant: msg.variant,
          title: msg.title,
          description: msg.description,
        });
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (password.length < 8) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Security Requirement',
        description: 'Passwords must be at least 8 characters long.',
      });
      return;
    }

    const trimmedName = (fullName || '').trim();
    // Require a non-empty name that contains at least one alphabetic character
    const validName = /^[A-Za-z\s]+$/.test(trimmedName);
    if (!validName) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Invalid Name',
        description: 'Please enter your full name (must be letters).',
      });
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: trimmedName });

      const idToken = await userCred.user.getIdToken();
      await fetch('/api/v1/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ email, name: trimmedName, uid: userCred.user.uid }),
      });

      setVerificationState({ email, uid: userCred.user.uid, name: trimmedName });
      setResendCooldown(60);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      const msg = resolveUserFriendlyMessage(error);
      if (msg) {
        toast({
          variant: msg.variant,
          title: msg.title,
          description: msg.description,
        });
      }
    }
  };

  const handleResend = async () => {
    if (!verificationState || resendCooldown > 0) return;
    try {
      setResendCooldown(60);
      toast({ title: 'Sending...', description: 'Requesting a new verification email.' });

      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/v1/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(verificationState),
      });

      if (!res.ok) throw new Error('Failed to send');

      toast({
        title: 'Email Sent',
        description: 'A new verification link has been sent to your inbox.',
      });
    } catch (error) {
      setResendCooldown(0);
      toast({
        title: 'Error',
        description: 'Failed to resend email.',
        variant: 'destructive',
      });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Failed to send password reset email');

      setResetEmailSent(true);
      toast({
        title: 'Reset Email Sent',
        description: "If an account exists, we've sent a reset link.",
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Something went wrong.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setLoading(false);
      if (error.code !== 'auth/popup-closed-by-user') {
        const msg = resolveUserFriendlyMessage(error);
        if (msg) {
          toast({
            variant: msg.variant,
            title: msg.title,
            description: msg.description,
          });
        }
      }
    }
  };

  if (isUserLoading || (user && !verificationState && !isPendingReview)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 className="w-10 h-10 animate-spin text-[#2F5FA7]" />
      </div>
    );
  }

  if (verificationState) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 relative overflow-hidden flex flex-col pt-24">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
        <LandingNav />
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md bg-white border-slate-100 shadow-xl relative overflow-hidden text-center p-8 rounded-[2rem]">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2F5FA7]" />
            <div className="mx-auto w-16 h-16 bg-blue-50 border border-blue-100 flex items-center justify-center rounded-full mb-6 relative">
              <ShieldCheck className="w-8 h-8 text-[#2F5FA7] relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Check Your Inbox</h2>
            <p className="text-slate-500 mb-8 font-medium leading-relaxed">
              We've sent a verification link to{' '}
              <strong className="text-[#2F5FA7]">{verificationState.email}</strong>.
            </p>
            <div className="space-y-4">
              <Button
                onClick={async () => {
                  await signOut(auth);
                  await fetch('/api/v1/auth/session', { method: 'DELETE' });
                  setVerificationState(null);
                }}
                className="w-full h-12 font-bold variant-outline border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full transition-all"
              >
                Back to Sign In
              </Button>
              <Button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="w-full h-12 font-bold gap-2 text-[#2F5FA7]"
                variant="ghost"
              >
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (isPendingReview) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 relative overflow-hidden flex flex-col pt-24">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />
        <LandingNav />
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md bg-white border-slate-100 shadow-xl relative overflow-hidden text-center p-8 rounded-[2rem]">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500" />
            <div className="mx-auto w-16 h-16 bg-amber-50 border border-amber-100 flex items-center justify-center rounded-full mb-6 relative">
              <Clock className="w-8 h-8 text-amber-500 relative z-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Pending</h2>
            <div className="space-y-4 text-left bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
              <div className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Application Received</p>
                  <p className="text-xs text-slate-500">Your details have reached our onboarding team.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Under Review</p>
                  <p className="text-xs text-slate-500">We are currently verifying your workshop capabilities.</p>
                </div>
              </div>
            </div>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              Hello <strong className="text-slate-900">{isPendingReview.name}</strong>, your application for
              <strong className="text-slate-900 ml-1">{isPendingReview.email}</strong> is being processed.
              We'll email you as soon as your MechMaster account is active.
            </p>
            <Button
              onClick={async () => {
                await signOut(auth);
                await fetch('/api/v1/auth/session', { method: 'DELETE' });
                setIsPendingReview(null);
              }}
              className="w-full h-12 font-bold variant-outline border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full transition-all"
            >
              Sign Out
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col pt-16 lg:pt-0">
      <LandingNav />

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex flex-col items-center gap-4 mb-2 lg:hidden">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                  {loginRole === 'vendor' ? 'MechMaster Access' : 'Secure Access'}
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  {loginRole === 'vendor'
                    ? 'Connect your factory to our managed supply chain.'
                    : 'The precision manufacturing portal for innovators.'}
                </p>
              </div>
            </div>

            {/* Role Toggle */}
            <div className="mb-6 p-1 bg-slate-100/80 rounded-2xl flex relative max-w-[280px] mx-auto border border-slate-200">
              <button
                onClick={() => setLoginRole('customer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${loginRole === 'customer' ? 'text-[#2F5FA7] bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                Customer
              </button>
              <button
                onClick={() => setLoginRole('vendor')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all relative z-10 ${loginRole === 'vendor' ? 'text-[#2F5FA7] bg-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Factory className="w-3.5 h-3.5" />
                Vendor
              </button>
            </div>

            <Tabs
              defaultValue={searchParams.get('tab') === 'register' ? 'register' : 'login'}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 border border-slate-200 p-1 rounded-2xl">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#2F5FA7] data-[state=active]:shadow-sm font-bold rounded-xl transition-all text-slate-500 uppercase tracking-widest text-[10px]"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#2F5FA7] data-[state=active]:shadow-sm font-bold rounded-xl transition-all text-slate-500 uppercase tracking-widest text-[10px]"
                >
                  {loginRole === 'vendor' ? 'Join Portal' : 'Register'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {isForgotPassword ? (
                  <Card className="bg-white border-slate-100 shadow-xl relative overflow-hidden rounded-[2rem]">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2F5FA7]" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        Reset Password
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium leading-relaxed">
                        {resetEmailSent
                          ? 'Check your email for a reset link.'
                          : `Enter your ${loginRole === 'vendor' ? 'registered' : 'verified'} email to receive a recovery link.`}
                      </CardDescription>
                    </CardHeader>
                    {!resetEmailSent ? (
                      <form onSubmit={handleForgotPassword}>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="reset-email"
                              className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                            >
                              Work Email
                            </Label>
                            <Input
                              id="reset-email"
                              name="email"
                              type="email"
                              placeholder="engineering@company.com"
                              className="bg-slate-50 border-slate-200 focus:border-[#2F5FA7] focus:ring-[#2F5FA7]/10 text-slate-900 placeholder:text-slate-400 h-11 px-4 rounded-xl"
                              required
                            />
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                          <Button
                            type="submit"
                            className="w-full h-12 font-bold bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-full shadow-lg shadow-blue-900/10 transition-all font-sans"
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Send Reset Link
                          </Button>
                          <Button
                            variant="ghost"
                            type="button"
                            className="w-full text-slate-500 hover:text-[#2F5FA7] hover:bg-blue-50/50"
                            onClick={() => setIsForgotPassword(false)}
                            disabled={loading}
                          >
                            Back to Sign In
                          </Button>
                        </CardFooter>
                      </form>
                    ) : (
                      <CardFooter className="flex flex-col gap-4 pb-8">
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                          onClick={() => {
                            setIsForgotPassword(false);
                            setResetEmailSent(false);
                          }}
                        >
                          Return to Sign In
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                ) : (
                  <Card className="bg-white border-slate-100 shadow-xl relative overflow-hidden rounded-[2rem]">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2F5FA7]" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        {loginRole === 'vendor' ? 'Vendor Portal' : 'Customer Hub'}
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium leading-relaxed">
                        {loginRole === 'vendor'
                          ? 'Access your workshop orders and quoting tools.'
                          : 'The precision manufacturing portal for innovators.'}
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignIn}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                          >
                            Work Email
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="engineering@company.com"
                            className="bg-slate-50 border-slate-200 focus:border-[#2F5FA7] focus:ring-[#2F5FA7]/10 text-slate-900 placeholder:text-slate-400 h-11 px-4 rounded-xl"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label
                              htmlFor="password"
                              className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                            >
                              Security Password
                            </Label>
                            <button
                              type="button"
                              onClick={() => setIsForgotPassword(true)}
                              className="text-xs font-bold text-[#2F5FA7] hover:text-[#1E3A66] transition-colors tracking-wide"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="bg-slate-50 border-slate-200 focus:border-[#2F5FA7] focus:ring-[#2F5FA7]/10 text-slate-900 placeholder:text-slate-400 h-11 px-4 rounded-xl"
                            required
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-4">
                        <Button
                          type="submit"
                          className="w-full h-12 font-bold bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-full shadow-lg shadow-blue-900/10 transition-all font-sans"
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <LogIn className="mr-2 h-4 w-4" />
                          )}
                          Log In to Hub
                        </Button>
                        <div className="relative w-full py-2">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-100"></span>
                          </div>
                          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest font-mono">
                            <span className="bg-white px-3 text-[#2F5FA7] border border-slate-100 rounded-full shadow-sm">
                              Secure Authentication
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full h-12 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 rounded-full font-bold text-sm gap-3 transition-all active:scale-[0.98] shadow-sm"
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                        >
                          <GoogleIcon className="w-5 h-5" />
                          Sign in with Google
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="register">
                {loginRole === 'vendor' ? (
                  <Card className="bg-white border-slate-100 shadow-xl relative overflow-hidden rounded-[2rem]">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        Join as Partner
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium leading-relaxed">
                        Become a verified MechMaster. Scale your workshop and access global production RFQs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                      <div className="space-y-4">
                        <div className="flex gap-4 items-start bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100">
                          <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-slate-900 shadow-sm-indigo">Vetted Network</p>
                            <p className="text-xs text-slate-600">Join elite manufacturing partners verified for precision and trust.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start bg-emerald-50/30 p-4 rounded-2xl border border-emerald-100">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-slate-900">Exclusive Demand</p>
                            <p className="text-xs text-slate-600">Access high-value projects directly from global innovators.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => router.push('/onboard')}
                        className="w-full h-12 font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 group"
                      >
                        Apply for MechMaster Role
                        <UserPlus className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="bg-white border-slate-100 shadow-xl relative overflow-hidden rounded-[2rem]">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2F5FA7]" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-slate-900">
                        Create Hub Account
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium leading-relaxed">
                        Join the managed manufacturing network.
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignUp}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="reg-name"
                            className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                          >
                            Full Name
                          </Label>
                          <Input
                            id="reg-name"
                            name="fullName"
                            type="text"
                            placeholder="John Doe"
                            className="bg-slate-50 border-slate-200 focus:border-[#2F5FA7] focus:ring-[#2F5FA7]/10 text-slate-900 placeholder:text-slate-400 h-11 px-4 rounded-xl"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="reg-email"
                            className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                          >
                            Work Email
                          </Label>
                          <Input
                            id="reg-email"
                            name="email"
                            type="email"
                            placeholder="name@organization.com"
                            className="bg-slate-50 border-slate-200 focus:border-[#2F5FA7] focus:ring-[#2F5FA7]/10 text-slate-900 placeholder:text-slate-400 h-11 px-4 rounded-xl"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label
                            htmlFor="reg-password"
                            className="text-slate-700 font-bold text-xs uppercase tracking-wider"
                          >
                            Create Password
                          </Label>
                          <Input
                            id="reg-password"
                            name="password"
                            type="password"
                            placeholder="Min. 8 characters"
                            className="bg-slate-50 border-slate-200 focus:border-[#2F5FA7] focus:ring-[#2F5FA7]/10 text-slate-900 placeholder:text-slate-400 h-11 px-4 rounded-xl"
                            minLength={8}
                            required
                          />
                        </div>
                        <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          <ShieldCheck className="w-4 h-4 text-[#2F5FA7]" />
                          All accounts subject to verification & NDA protocols.
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-4">
                        <Button
                          type="submit"
                          className="w-full h-12 font-bold bg-[#2F5FA7] hover:bg-[#1E3A66] text-white rounded-full shadow-lg shadow-blue-900/10 transition-all font-sans"
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <UserPlus className="mr-2 h-4 w-4" />
                          )}
                          Register as Innovator
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="hidden lg:block lg:w-1/2 relative overflow-hidden h-screen fixed right-0 top-0 h-[900px] w-[800px]">
          <Image
            src="/manufacturing_clean.png"
            alt="Manufacturing Facility"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-slate-950/20" />

          <div className="absolute bottom-24 left-24 right-24 space-y-6 z-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                Industry 4.0 Verified
              </span>
            </div>

            <h2 className="text-4xl font-black text-white leading-[1.05] tracking-tight uppercase">
              The Hub of <br />
              <span className="text-blue-500">Managed</span> <br />
              Manufacturing.
            </h2>

            <p className="text-slate-400 text-md font-medium max-w-sm leading-relaxed">
              Experience the future of on-demand production with MechHub's secure, automated supply
              chain network.
            </p>

            <div className="pt-8 grid grid-cols-3 gap-8 border-t border-white/10">
              <div>
                <div className="text-white text-xl font-black">99.9%</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Quality Yield
                </div>
              </div>
              <div>
                <div className="text-white text-xl font-black">24h</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Rapid Response
                </div>
              </div>
              <div>
                <div className="text-white text-xl font-black">ISO</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Certified Ops
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-[#2F5FA7] animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
