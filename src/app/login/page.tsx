'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
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
import '@/components/home/landing.css';
import { landingFontVars } from '@/components/home/fonts';
import { cn } from '@/utils';
import { Loader2, UserPlus, LogIn, ShieldCheck, Factory, User as UserIcon, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  getAdditionalUserInfo,
  deleteUser,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { trackEvent } from '@/lib/analytics';
import { resolveUserFriendlyMessage } from '@/lib/error-mapping';
import { getSafeRedirectPath } from '@/lib/auth-safety';
import { isVendorRole } from '@/lib/roles';
import { logger } from '@/utils/logger';

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

  // Handle callback query params (verified=true, or error=...). There is no
  // ?token= auto-sign-in: a login link would let anyone sign a victim into the
  // sender's account, and verification links must not carry credentials.
  useEffect(() => {
    const verified = searchParams.get('verified');
    const error = searchParams.get('error');

    if (verified === 'true') {
      toast({
        title: 'Email Verified',
        description: 'Your account is now verified. You can sign in.',
        variant: 'default',
      });
      // Keep where they were heading (getSafeRedirectPath validates it after sign-in)
      const redirect = searchParams.get('redirect');
      router.replace(redirect ? `/login?tab=login&redirect=${encodeURIComponent(redirect)}` : '/login?tab=login');
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
  }, [searchParams, router, toast, auth]);

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
  const createSession = async (user: User, expectedRole: string) => {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/v1/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, expectedRole }),
      });
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
        // If we have a verified user, ensure we clear any pending verification UI
        if (user.emailVerified && verificationState) {
          setVerificationState(null);
        }
        setLoading(true);
        try {
          // 2. Establish Server Session with expected role
          const sessionData = await createSession(user, loginRole);

          // Handle Session Failures (e.g., Email Verification Required or Role Mismatch)
          if (!sessionData || sessionData.status !== 'success') {
            const isUnverifiedError = sessionData?.error?.includes('Email verification required') ||
              sessionData?.message?.includes('Email verification required');

            if (isUnverifiedError && user.providerData?.[0]?.providerId === 'password') {
              setVerificationState({
                email: user.email || '',
                uid: user.uid,
                name: user.displayName || 'Innovator',
              });
              setLoading(false);
              return;
            }

            const msg = sessionData?.message || '';
            const isRegistrationRequired = msg.includes('not registered yet');
            const isMismatch = msg.includes('already registered');

            toast({
              title: isRegistrationRequired
                ? 'Registration Required'
                : isMismatch
                  ? 'Registration Mismatch'
                  : 'Authentication Failed',
              description: msg || 'We could not establish your secure session. Please try again.',
              variant: 'destructive',
            });

            await signOut(auth);
            setLoading(false);
            return;
          }

          // 3. Flow Normalization
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

          // 4. Role-Toggle Validation
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
      // Handle the Auth success. 
      // The actual redirection and session sync is handled by the useEffect(syncUserAndRedirect) 
      // watcher which responds to the changes in the 'user' object from useAuthState.
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

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('fullName') as string;
    const rawEmail = formData.get('email') as string;
    const email = (rawEmail || '').trim().toLowerCase();
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

      // 1. Proactively provision user document in Firestore
      // This ensures the record exists immediately, even before email verification.
      const provisionRes = await fetch('/api/v1/user/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ email, fullName: trimmedName, role: loginRole }),
      });

      if (!provisionRes.ok) {
        const errorData = await provisionRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Profile creation failed during registration');
      }
      trackEvent('sign_up', { method: 'email', role: loginRole });

      // 2. Send verification email
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
      // Clean rollback: if Auth user was created but downstream provisioning failed, delete the newly created Auth user
      if (auth.currentUser && auth.currentUser.email?.toLowerCase() === email) {
        await deleteUser(auth.currentUser).catch((delErr) => {
          console.error('Rollback of created auth user failed:', delErr);
        });
      }
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
      const result = await signInWithPopup(auth, provider);
      if (getAdditionalUserInfo(result)?.isNewUser) {
        trackEvent('sign_up', { method: 'google', role: loginRole });
      }
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
      <div className={cn('lp-root min-h-screen flex items-center justify-center', landingFontVars)}>
        <Loader2 className="w-10 h-10 animate-spin text-lp-primary" />
      </div>
    );
  }

  if (verificationState) {
    return (
      <div className={cn('lp-root min-h-screen lp-hero-dots relative flex flex-col pt-12', landingFontVars)}>
        <div className="absolute top-8 left-8 z-50">
          <Link href="/" className="lp-label-mono flex items-center gap-2 text-lp-muted-fg hover:text-lp-primary transition-colors group">
            <div className="flex size-10 items-center justify-center border border-lp-border bg-lp-bg">
              <ArrowLeft className="size-5" />
            </div>
            Back to Hub
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md border border-lp-border bg-lp-bg text-center p-8">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />
            <div className="mx-auto flex size-16 items-center justify-center bg-lp-accent text-lp-primary mb-6">
              <ShieldCheck className="size-8" />
            </div>
            <h2 className="text-2xl font-medium tracking-tight">Check Your Inbox</h2>
            <p className="mt-2 text-sm text-lp-muted-fg">
              We&apos;ve sent a verification link to{' '}
              <strong className="text-lp-primary">{verificationState.email}</strong>.
            </p>
            <div className="mt-8 space-y-3">
              <Button
                onClick={async () => {
                  await signOut(auth);
                  await fetch('/api/v1/auth/session', { method: 'DELETE' });
                  setVerificationState(null);
                }}
                className="lp-label-mono w-full h-12 bg-lp-bg border border-lp-border text-lp-fg hover:bg-lp-accent rounded-sm"
              >
                Back to Sign In
              </Button>
              <Button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                variant="ghost"
                className="lp-label-mono w-full h-12 text-lp-primary rounded-sm"
              >
                {resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : 'Resend Verification Email'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isPendingReview) {
    return (
      <div className={cn('lp-root min-h-screen lp-hero-dots relative flex flex-col pt-12', landingFontVars)}>
        <div className="absolute top-8 left-8 z-50">
          <Link href="/" className="lp-label-mono flex items-center gap-2 text-lp-muted-fg hover:text-lp-primary transition-colors group">
            <div className="flex size-10 items-center justify-center border border-lp-border bg-lp-bg">
              <ArrowLeft className="size-5" />
            </div>
            Back to Hub
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 relative z-10">
          <div className="w-full max-w-md border border-lp-border bg-lp-bg text-center p-10 relative">
            <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500" />

            <div className="mx-auto flex size-20 items-center justify-center bg-amber-50 text-amber-500 mb-8">
              <Clock className="size-10" />
            </div>

            <h2 className="text-3xl font-medium tracking-tight">Review in Progress</h2>

            <p className="mt-3 text-sm text-lp-muted-fg leading-relaxed px-2">
              Our engineering team is currently verifying <strong className="text-lp-primary">{isPendingReview.name}&apos;s</strong> manufacturing capabilities. We maintain high standards to ensure quality across the network.
            </p>

            <div className="mt-8 mb-8 space-y-4 text-left border-y border-lp-border py-8">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex size-6 items-center justify-center bg-emerald-500 text-white rounded-full">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div className="w-0.5 h-10 bg-emerald-100 mt-1" />
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    Profile Received
                    <span className="lp-label-mono bg-emerald-50 text-emerald-600 px-2 py-0.5">Done</span>
                  </p>
                  <p className="text-xs text-lp-muted-fg">Your application for {isPendingReview.email} is safe with us.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex size-6 items-center justify-center bg-amber-100 border-2 border-amber-200 rounded-full animate-pulse">
                    <div className="size-2 bg-amber-500 rounded-full" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    Engineering Audit
                    <span className="lp-label-mono bg-amber-50 text-amber-600 px-2 py-0.5 animate-pulse">Live</span>
                  </p>
                  <p className="text-xs text-lp-muted-fg">Verifying workshop precision and bandwidth.</p>
                </div>
              </div>
            </div>

            <Button
              onClick={async () => {
                await signOut(auth);
                await fetch('/api/v1/auth/session', { method: 'DELETE' });
                setIsPendingReview(null);
              }}
              variant="outline"
              className="lp-label-mono w-full h-12 border-lp-border text-lp-muted-fg hover:bg-lp-accent rounded-sm active:scale-[0.98]"
            >
              Securely Logout & Exit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('lp-root min-h-screen relative flex flex-col', landingFontVars)}>
      <div className="absolute top-8 left-8 z-50">
        <Link href="/" className="lp-label-mono flex items-center gap-2 text-lp-muted-fg hover:text-lp-primary transition-colors group">
          <div className="flex size-10 items-center justify-center border border-lp-border bg-lp-bg">
            <ArrowLeft className="size-5" />
          </div>
          Exit to Hub
        </Link>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center gap-4 mb-2 lg:hidden">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-medium tracking-tight">
                  {loginRole === 'vendor' ? 'MechMaster Access' : 'Secure Access'}
                </h1>
                <p className="text-xs text-lp-muted-fg leading-relaxed">
                  {loginRole === 'vendor'
                    ? 'Connect your factory to our managed supply chain.'
                    : 'The precision manufacturing portal for innovators.'}
                </p>
              </div>
            </div>

            {/* Role Toggle */}
            <div className="mb-6 p-1 bg-lp-accent flex relative max-w-[280px] mx-auto border border-lp-border">
              <button
                onClick={() => setLoginRole('customer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 lp-label-mono transition-all relative z-10 ${loginRole === 'customer' ? 'text-lp-primary bg-lp-bg' : 'text-lp-muted-fg hover:text-lp-fg'}`}
              >
                <UserIcon className="size-3.5" />
                Customers
              </button>
              <button
                onClick={() => setLoginRole('vendor')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 lp-label-mono transition-all relative z-10 ${loginRole === 'vendor' ? 'text-lp-primary bg-lp-bg' : 'text-lp-muted-fg hover:text-lp-fg'}`}
              >
                <Factory className="size-3.5" />
                Vendors
              </button>
            </div>

            <Tabs
              defaultValue={searchParams.get('tab') === 'login' ? 'login' : 'register'}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-lp-accent border border-lp-border p-1">
                <TabsTrigger
                  value="register"
                  className="lp-label-mono data-[state=active]:bg-lp-bg data-[state=active]:text-lp-primary transition-all text-lp-muted-fg rounded-sm"
                >
                  {loginRole === 'vendor' ? 'Join Portal' : 'Register'}
                </TabsTrigger>
                <TabsTrigger
                  value="login"
                  className="lp-label-mono data-[state=active]:bg-lp-bg data-[state=active]:text-lp-primary transition-all text-lp-muted-fg rounded-sm"
                >
                  Sign In
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {isForgotPassword ? (
                  <Card className="border-lp-border bg-lp-bg relative overflow-hidden rounded-sm shadow-none">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-medium tracking-tight">
                        Reset Password
                      </CardTitle>
                      <CardDescription className="text-lp-muted-fg leading-relaxed">
                        {resetEmailSent
                          ? 'Check your email for a reset link.'
                          : `Enter your ${loginRole === 'vendor' ? 'registered' : 'verified'} email to receive a recovery link.`}
                      </CardDescription>
                    </CardHeader>
                    {!resetEmailSent ? (
                      <form onSubmit={handleForgotPassword}>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email" className="lp-label-mono text-lp-primary">
                              Work Email
                            </Label>
                            <Input
                              id="reset-email"
                              name="email"
                              type="email"
                              placeholder="engineering@company.com"
                              className="h-12 border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm"
                              required
                            />
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                          <Button
                            type="submit"
                            className="lp-label-mono w-full h-12 bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm transition-all active:scale-[0.98]"
                            disabled={loading}
                          >
                            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                            Send Reset Link
                          </Button>
                          <Button
                            variant="ghost"
                            type="button"
                            className="w-full text-lp-muted-fg hover:text-lp-primary hover:bg-lp-accent rounded-sm"
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
                          className="w-full border-lp-border hover:bg-lp-accent text-lp-fg rounded-sm"
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
                  <Card className="border-lp-border bg-lp-bg relative overflow-hidden rounded-sm shadow-none">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-medium tracking-tight">
                        {loginRole === 'vendor' ? 'Vendor Portal' : 'Customer Portal'}
                      </CardTitle>
                      <CardDescription className="text-lp-muted-fg leading-relaxed">
                        {loginRole === 'vendor'
                          ? 'Access your workshop orders and quoting tools.'
                          : 'The precision manufacturing portal for innovators.'}
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignIn}>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="lp-label-mono text-lp-primary">
                            Work Email
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="engineering@company.com"
                            className="h-12 border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="lp-label-mono text-lp-primary">
                              Security Password
                            </Label>
                            <button
                              type="button"
                              onClick={() => setIsForgotPassword(true)}
                              className="text-xs text-lp-primary hover:text-lp-primary/70 transition-colors"
                            >
                              Forgot password?
                            </button>
                          </div>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="h-12 border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm"
                            required
                          />
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-4">
                        <Button
                          type="submit"
                          className="lp-label-mono w-full h-12 bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm transition-all active:scale-[0.98]"
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <LogIn className="mr-2 size-4" />
                          )}
                          Log In to Hub
                        </Button>
                        <div className="relative w-full py-2">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-lp-border"></span>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="lp-label-mono bg-lp-bg px-3 text-lp-muted-fg">
                              Or continue with
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          type="button"
                          className="w-full h-12 bg-lp-bg hover:bg-lp-accent text-lp-fg border-lp-border rounded-sm text-sm gap-3 transition-all active:scale-[0.98]"
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                        >
                          <GoogleIcon className="size-5" />
                          Sign in with Google
                        </Button>
                      </CardFooter>
                    </form>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="register">
                {loginRole === 'vendor' ? (
                  <Card className="border-lp-border bg-lp-bg relative overflow-hidden rounded-sm shadow-none">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-medium tracking-tight flex items-center gap-3">
                        Join as Partner
                      </CardTitle>
                      <CardDescription className="text-lp-muted-fg leading-relaxed">
                        Become a verified MechMaster. Scale your workshop and access global production RFQs.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pb-8">
                      <div className="space-y-4">
                        <div className="flex gap-4 items-start bg-lp-accent p-4 border border-lp-border">
                          <ShieldCheck className="size-6 text-lp-primary shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Vetted Network</p>
                            <p className="text-xs text-lp-muted-fg">Join elite manufacturing partners verified for precision and trust.</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start bg-lp-accent p-4 border border-lp-border">
                          <CheckCircle2 className="size-6 text-emerald-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">Exclusive Demand</p>
                            <p className="text-xs text-lp-muted-fg">Access high-value projects directly from global innovators.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={() => router.push('/onboard')}
                        className="lp-label-mono w-full h-12 bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm transition-all flex items-center justify-center gap-2 group active:scale-[0.98]"
                      >
                        Apply for MechMaster Role
                        <UserPlus className="size-4 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </CardFooter>
                  </Card>
                ) : (
                  <Card className="border-lp-border bg-lp-bg relative overflow-hidden rounded-sm shadow-none">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />
                    <CardHeader>
                      <CardTitle className="text-2xl font-medium tracking-tight">
                        Create Hub Account
                      </CardTitle>
                      <CardDescription className="text-lp-muted-fg leading-relaxed">
                        Join the managed manufacturing network.
                      </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSignUp}>
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-lp-accent border border-lp-border">
                          <UserIcon className="size-4 text-lp-primary" />
                          <span className="lp-label-mono text-lp-primary">
                            Account Type:
                          </span>
                          <span className="lp-label-mono text-lp-fg">
                            Innovator
                          </span>
                          <CheckCircle2 className="size-4 text-emerald-500 ml-auto" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-name" className="lp-label-mono text-lp-primary">
                            Full Name
                          </Label>
                          <Input
                            id="reg-name"
                            name="fullName"
                            type="text"
                            placeholder="John Doe"
                            className="h-12 border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-email" className="lp-label-mono text-lp-primary">
                            Work Email
                          </Label>
                          <Input
                            id="reg-email"
                            name="email"
                            type="email"
                            placeholder="name@organization.com"
                            className="h-12 border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-password" className="lp-label-mono text-lp-primary">
                            Create Password
                          </Label>
                          <Input
                            id="reg-password"
                            name="password"
                            type="password"
                            placeholder="Min. 8 characters"
                            className="h-12 border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm"
                            minLength={8}
                            required
                          />
                        </div>
                        <div className="pt-2 flex items-center gap-2 lp-label-mono text-lp-muted-fg">
                          <ShieldCheck className="size-4 text-lp-primary" />
                          All accounts subject to verification & NDA protocols.
                        </div>
                      </CardContent>
                      <CardFooter className="flex flex-col gap-4">
                        <Button
                          type="submit"
                          className="lp-label-mono w-full h-12 bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm transition-all active:scale-[0.98]"
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <UserPlus className="mr-2 size-4" />
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
          <div className="absolute inset-0 bg-gradient-to-t from-lp-ink/90 via-lp-ink/40 to-lp-ink/20" />

          <div className="absolute bottom-24 left-24 right-24 space-y-6 z-20">
            <div className="lp-label-mono inline-flex items-center gap-2 px-3 py-1 border border-lp-primary/30 bg-lp-primary/10 backdrop-blur-xl text-lp-primary">
              <span className="size-2 bg-lp-primary rounded-full animate-ping" />
              Industry 4.0 Verified
            </div>

            <h2 className="text-4xl font-medium text-white leading-[1.05] tracking-tight">
              The Hub of <br />
              <span className="font-lp-serif italic opacity-70">Managed</span> <br />
              Manufacturing.
            </h2>

            <p className="text-white/60 text-md max-w-sm leading-relaxed">
              Experience the future of on-demand production with MechHub&apos;s secure, automated supply
              chain network.
            </p>

            <div className="pt-8 grid grid-cols-3 gap-8 border-t border-white/10">
              <div>
                <div className="text-white text-xl font-medium">99.9%</div>
                <div className="lp-label-mono text-white/40">Quality Yield</div>
              </div>
              <div>
                <div className="text-white text-xl font-medium">24h</div>
                <div className="lp-label-mono text-white/40">Rapid Response</div>
              </div>
              <div>
                <div className="text-white text-xl font-medium">ISO</div>
                <div className="lp-label-mono text-white/40">Certified Ops</div>
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
      <div className={cn('lp-root min-h-screen flex items-center justify-center', landingFontVars)}>
        <Loader2 className="size-10 text-lp-primary animate-spin" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
