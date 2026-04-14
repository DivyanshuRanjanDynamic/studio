'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { checkIsAdmin } from '@/lib/auth-utils';
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
import { Loader2, UserPlus, LogIn, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  getIdTokenResult,
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

  // Handle verified=true from callback
  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      toast({
        title: 'Email Verified',
        description: 'Your account is now verified. You can sign in.',
        variant: 'default',
      });
      // Clean up URL
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
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch('/api/v1/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (!res.ok) {
        throw new Error('Failed to establish secure session.');
      }
      return true;
    } catch (error) {
      console.error('Session creation failed:', error);
      toast({
        title: 'Session Error',
        description: 'We could not secure your session. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    async function syncUserAndRedirect() {
      if (user && db) {
        // 1. Enforce email verification
        if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
          setVerificationState({
            email: user.email || '',
            uid: user.uid,
            name: user.displayName || 'Innovator',
          });
          await signOut(auth);
          await fetch('/api/v1/auth/session', { method: 'DELETE' });
          return;
        }

        setLoading(true);
        try {
          // 2. Establish Server Session
          const sessionCreated = await createSession(user);
          if (!sessionCreated) {
            await signOut(auth);
            return;
          }

          // 3. Check Claims and Sync Profile
          const tokenResult = await getIdTokenResult(user);
          const isAdmin = checkIsAdmin(tokenResult.claims);
          
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          let role = isAdmin ? 'admin' : 'customer';

          if (!userSnap.exists()) {
            const initialProfile = {
              uid: user.uid,
              fullName: user.displayName || '',
              email: user.email,
              role: role,
              onboarded: false,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              emailVerified: user.emailVerified,
            };
            await setDoc(userRef, initialProfile);
          } else {
            const profileData = userSnap.data();
            // Sync Firestore role with claims if needed
            if (role === 'admin' && profileData.role !== 'admin') {
              await setDoc(userRef, { role: 'admin' }, { merge: true });
            } else {
              role = profileData.role || 'customer';
            }
          }

          // 4. Redirect based on role
          const redirectPath = getSafeRedirectPath(searchParams.get('redirect'));
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
      // If not verified, useEffect will handle it.
      if (!userCred.user.emailVerified) {
        setVerificationState({
          email: userCred.user.email || '',
          uid: userCred.user.uid,
          name: userCred.user.displayName || 'Innovator',
        });
        await signOut(auth);
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

      await fetch('/api/v1/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: trimmedName, uid: userCred.user.uid }),
      });

      setVerificationState({ email, uid: userCred.user.uid, name: trimmedName });
      setResendCooldown(60);
      await signOut(auth);
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

      const res = await fetch('/api/v1/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  if (isUserLoading || (user && !verificationState)) {
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
                onClick={() => setVerificationState(null)}
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col pt-16 lg:pt-0">
      <LandingNav />

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex flex-col items-center gap-4 mb-2 lg:hidden">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                  Secure Access
                </h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                  Sign in to your manufacturing workspace
                </p>
              </div>
            </div>

            <Tabs
              defaultValue={searchParams.get('tab') === 'register' ? 'register' : 'login'}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-slate-100 border border-slate-200 p-1 rounded-2xl">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#2F5FA7] data-[state=active]:shadow-sm font-bold rounded-xl transition-all text-slate-500"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#2F5FA7] data-[state=active]:shadow-sm font-bold rounded-xl transition-all text-slate-500"
                >
                  Register
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
                      <CardDescription className="text-slate-500 font-medium">
                        {resetEmailSent
                          ? 'Check your email for a reset link.'
                          : 'Enter your verified email to receive a reset link.'}
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
                        Account Access
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium">
                        Enter your verified credentials to continue.
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
                <Card className="bg-white border-slate-100 shadow-xl relative overflow-hidden rounded-[2rem]">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-[#2F5FA7]" />
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      Create Hub Account
                    </CardTitle>
                    <CardDescription className="text-slate-500 font-medium">
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
