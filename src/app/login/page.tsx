'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/utils';
import {
  ArrowRight,
  Check,
  Clock,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Factory,
  ShieldCheck,
  SignIn,
  User as UserIcon,
  UserPlus,
} from '@phosphor-icons/react/dist/ssr';
import { AuthShell, AuthSkeleton, fieldClass } from '@/components/auth/AuthShell';
import { Accent, Tag } from '@/components/home/primitives';
import { buttonClass } from '@/components/home/button';
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

  const role = loginRole;
  const signOutAndReset = async (after: () => void) => {
    await signOut(auth);
    await fetch('/api/v1/auth/session', { method: 'DELETE' });
    after();
  };

  if (isUserLoading || (user && !verificationState && !isPendingReview)) {
    return (
      <AuthShell role={role}>
        <AuthSkeleton />
      </AuthShell>
    );
  }

  if (verificationState) {
    return (
      <AuthShell role={role}>
        <div className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary">
            <EnvelopeSimple aria-hidden="true" className="size-8" weight="duotone" />
          </span>
          <h1 className="heading-4 mt-6">
            Check your <Accent>inbox</Accent>
          </h1>
          <p className="body-6 mt-2 text-lp-muted-fg">
            We sent a verification link to <span className="body-4 text-lp-fg">{verificationState.email}</span>.
          </p>
        </div>

        <ol className="mt-8 space-y-2">
          {['Open the email from MechHub', 'Click the verification link', 'Come back here and sign in'].map((step, i) => (
            <li key={step} className="flex items-center gap-3 rounded-xl border border-lp-border bg-lp-card px-4 py-3">
              <span className="lp-mono flex size-6 shrink-0 items-center justify-center rounded-full bg-lp-primary text-lp-primary-fg">
                {i + 1}
              </span>
              <span className="body-5">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 space-y-2">
          <button type="button" onClick={() => signOutAndReset(() => setVerificationState(null))} className={cn(buttonClass('primary'), 'w-full')}>
            Back to sign in
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className={cn(buttonClass('secondary'), 'w-full disabled:cursor-not-allowed disabled:opacity-60')}
          >
            {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification email'}
          </button>
        </div>
        <p className="caption-2 mt-6 text-center text-lp-muted-fg">Not there? Check your spam or promotions folder.</p>
      </AuthShell>
    );
  }

  if (isPendingReview) {
    const stages = [
      { title: 'Application received', body: `Your application for ${isPendingReview.email} is safe with us.`, done: true },
      { title: 'Engineering review', body: 'We are checking your workshop’s capabilities and capacity.', done: false },
      { title: 'Portal access', body: 'You will be able to sign in and receive orders once approved.', done: false },
    ];
    return (
      <AuthShell role="vendor">
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary">
          <Clock aria-hidden="true" className="size-8" weight="duotone" />
        </span>
        <h1 className="heading-4 mt-6 text-center">
          Review in <Accent>progress</Accent>
        </h1>
        <p className="body-6 mt-2 text-center text-lp-muted-fg">
          Our engineering team is reviewing <span className="body-4 text-lp-fg">{isPendingReview.name}</span>’s
          manufacturing capabilities. We keep the bar high so every buyer gets reliable parts.
        </p>

        <ol className="mt-8">
          {stages.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'flex size-6 shrink-0 items-center justify-center rounded-full',
                    s.done ? 'bg-lp-primary text-lp-primary-fg' : i === 1 ? 'border-2 border-lp-primary bg-lp-bg' : 'border border-lp-border bg-lp-bg'
                  )}
                >
                  {s.done && <Check aria-hidden="true" className="size-3" weight="bold" />}
                </span>
                {i < stages.length - 1 && <span aria-hidden="true" className="my-1 w-px flex-1 bg-lp-border" />}
              </div>
              <div className="pb-6">
                <p className="title-4 flex items-center gap-2">
                  {s.title}
                  <span className={cn('lp-mono rounded px-1', s.done ? 'bg-lp-primary/10 text-lp-primary' : i === 1 ? 'bg-lp-muted text-lp-fg' : 'text-lp-muted-fg')}>
                    {s.done ? 'Done' : i === 1 ? 'Now' : 'Next'}
                  </span>
                </p>
                <p className="caption-2 mt-1 text-lp-muted-fg">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <button type="button" onClick={() => signOutAndReset(() => setIsPendingReview(null))} className={cn(buttonClass('secondary'), 'w-full')}>
          Sign out
        </button>
      </AuthShell>
    );
  }

  const tab = searchParams.get('tab') === 'login' ? 'login' : 'register';

  return (
    <AuthShell role={role}>
      <div className="text-center">
        <Tag>{role === 'vendor' ? 'MechMaster portal' : 'Customer portal'}</Tag>
        <h1 className="heading-3 mt-4">
          {role === 'vendor' ? (
            <>
              Welcome, <Accent>MechMaster</Accent>
            </>
          ) : (
            <>
              Welcome to <Accent>MechHub</Accent>
            </>
          )}
        </h1>
        <p className="body-6 mt-2 text-lp-muted-fg">
          {role === 'vendor'
            ? 'Manage your workshop orders and quotes.'
            : 'Upload a STEP file, get an instant quote and track every order.'}
        </p>
      </div>

      {/* Who is signing in */}
      <div role="radiogroup" aria-label="Account type" className="mx-auto mt-8 grid max-w-[320px] grid-cols-2 gap-1 rounded-full border border-lp-border bg-lp-card p-1">
        {(
          [
            { value: 'customer', label: 'Customer', icon: UserIcon },
            { value: 'vendor', label: 'MechMaster', icon: Factory },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={role === value}
            onClick={() => setLoginRole(value)}
            className={cn(
              'button-sm flex items-center justify-center gap-2 rounded-full px-3 py-2 transition-colors duration-300 ease-lp',
              role === value ? 'bg-lp-bg text-lp-primary shadow-sm' : 'text-lp-muted-fg hover:text-lp-fg'
            )}
          >
            <Icon aria-hidden="true" className="size-4" weight={role === value ? 'fill' : 'regular'} />
            {label}
          </button>
        ))}
      </div>

      <Tabs defaultValue={tab} className="mt-6 w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-none border-b border-lp-border bg-transparent p-0">
          {[
            { value: 'register', label: role === 'vendor' ? 'Join the network' : 'Create account' },
            { value: 'login', label: 'Sign in' },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="button-sm -mb-px rounded-none border-b-2 border-transparent px-3 py-3 text-lp-muted-fg shadow-none transition-colors duration-300 ease-lp hover:text-lp-fg data-[state=active]:border-lp-primary data-[state=active]:bg-transparent data-[state=active]:text-lp-fg data-[state=active]:shadow-none"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="login" className="mt-6">
          {isForgotPassword ? (
            <div>
              <h2 className="heading-6">Reset your password</h2>
              <p className="body-6 mt-1 text-lp-muted-fg">
                {resetEmailSent
                  ? 'If an account exists for that email, a reset link is on its way.'
                  : `Enter your ${role === 'vendor' ? 'registered' : 'verified'} email and we will send you a reset link.`}
              </p>
              {!resetEmailSent ? (
                <form onSubmit={handleForgotPassword} className="mt-6 space-y-4">
                  <Field id="reset-email" label="Email">
                    <input id="reset-email" name="email" type="email" autoComplete="email" placeholder="you@company.in" required className={fieldClass()} />
                  </Field>
                  <button type="submit" disabled={loading} aria-busy={loading} className={cn(buttonClass('primary'), 'w-full disabled:opacity-60')}>
                    {loading ? 'Sending link' : 'Send reset link'}
                  </button>
                  <button type="button" onClick={() => setIsForgotPassword(false)} disabled={loading} className={cn(buttonClass('secondary'), 'w-full')}>
                    Back to sign in
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setResetEmailSent(false);
                  }}
                  className={cn(buttonClass('secondary'), 'mt-6 w-full')}
                >
                  Return to sign in
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="space-y-4">
              <button type="button" onClick={handleGoogleSignIn} disabled={loading} className={cn(buttonClass('secondary'), 'w-full gap-3 py-3')}>
                <GoogleIcon className="size-5" aria-hidden="true" />
                Continue with Google
              </button>
              <Divider />
              <Field id="email" label="Email">
                <input id="email" name="email" type="email" autoComplete="email" placeholder="you@company.in" required className={fieldClass()} />
              </Field>
              <Field
                id="password"
                label="Password"
                action={
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="caption-1 rounded text-lp-primary hover:opacity-80">
                    Forgot password?
                  </button>
                }
              >
                <PasswordInput id="password" name="password" autoComplete="current-password" required />
              </Field>
              <button type="submit" disabled={loading} aria-busy={loading} className={cn(buttonClass('primary'), 'w-full py-3 disabled:opacity-60')}>
                {loading ? 'Signing in' : 'Sign in'}
                {!loading && <SignIn aria-hidden="true" className="size-4" weight="bold" />}
              </button>
            </form>
          )}
        </TabsContent>

        <TabsContent value="register" className="mt-6">
          {role === 'vendor' ? (
            <div>
              <h2 className="heading-6">Become a MechMaster</h2>
              <p className="body-6 mt-1 text-lp-muted-fg">
                Run a laser cutter, CNC unit or fabrication shop? Apply to join the network and receive orders through
                MechHub.
              </p>
              <ul className="mt-6 space-y-2">
                {[
                  { icon: ShieldCheck, title: 'Vetted network', body: 'Every partner passes our technical and delivery checks.' },
                  { icon: Factory, title: 'Steady demand', body: 'Orders from verified buyers, with drawings and specs sorted.' },
                ].map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-3 rounded-xl border border-lp-border bg-lp-card p-4">
                    <Icon aria-hidden="true" className="size-5 shrink-0 text-lp-primary" weight="duotone" />
                    <span>
                      <span className="title-4 block">{title}</span>
                      <span className="caption-2 text-lp-muted-fg">{body}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => router.push('/onboard')} className={cn(buttonClass('primary'), 'mt-6 w-full py-3')}>
                Apply to join
                <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <button type="button" onClick={handleGoogleSignIn} disabled={loading} className={cn(buttonClass('secondary'), 'w-full gap-3 py-3')}>
                <GoogleIcon className="size-5" aria-hidden="true" />
                Sign up with Google
              </button>
              <Divider />
              <Field id="reg-name" label="Full name">
                <input id="reg-name" name="fullName" type="text" autoComplete="name" placeholder="Aarav Mehta" required className={fieldClass()} />
              </Field>
              <Field id="reg-email" label="Email">
                <input id="reg-email" name="email" type="email" autoComplete="email" placeholder="you@company.in" required className={fieldClass()} />
              </Field>
              <Field id="reg-password" label="Password" hint="At least 8 characters">
                <PasswordInput id="reg-password" name="password" autoComplete="new-password" minLength={8} required />
              </Field>
              <button type="submit" disabled={loading} aria-busy={loading} className={cn(buttonClass('primary'), 'w-full py-3 disabled:opacity-60')}>
                {loading ? 'Creating your account' : 'Create account'}
                {!loading && <UserPlus aria-hidden="true" className="size-4" weight="bold" />}
              </button>
              <p className="caption-2 flex items-start gap-2 text-lp-muted-fg">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-lp-primary" />
                <span>
                  By creating an account you agree to our <Link href="/terms-of-service" className="text-lp-primary underline underline-offset-4">terms</Link> and{' '}
                  <Link href="/privacy-policy" className="text-lp-primary underline underline-offset-4">privacy policy</Link>. Every file you upload is covered by our NDA.
                </span>
              </p>
            </form>
          )}
        </TabsContent>
      </Tabs>
    </AuthShell>
  );
}

function Field({
  id,
  label,
  hint,
  action,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="title-4">
          {label}
        </label>
        {action}
      </div>
      {children}
      {hint && <p className="caption-5 text-lp-muted-fg">{hint}</p>}
    </div>
  );
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} placeholder="••••••••" className={cn(fieldClass(), 'pr-12')} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-lp-muted-fg transition-colors duration-300 ease-lp hover:bg-lp-muted hover:text-lp-fg"
      >
        {visible ? <EyeSlash aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3" role="separator">
      <span className="h-px flex-1 bg-lp-border" />
      <span className="lp-mono text-lp-muted-fg">or with email</span>
      <span className="h-px flex-1 bg-lp-border" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthSkeleton />
        </AuthShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
