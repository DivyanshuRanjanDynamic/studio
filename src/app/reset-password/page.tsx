'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Key, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { useToast } from '@/hooks/use-toast';
import { AuthShell, AuthSkeleton, fieldClass } from '@/components/auth/AuthShell';
import { Accent } from '@/components/home/primitives';
import { buttonClass } from '@/components/home/button';
import { cn } from '@/utils';

function ResetPasswordForm() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    async function checkCode() {
      if (!oobCode) {
        setError('Invalid or missing reset token.');
        setVerifying(false);
        return;
      }

      try {
        const verifiedEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(verifiedEmail);
        setVerifying(false);
      } catch (err: any) {
        console.error('Code verification failed:', err);
        setError('Your password reset link has expired or is invalid. Please request a new one.');
        setVerifying(false);
      }
    }

    checkCode();
  }, [auth, oobCode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!oobCode || !email) return;

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords mismatch',
        description: 'The passwords you entered do not match.',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Password too short',
        description: 'Password should be at least 6 characters.',
      });
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);

      toast({
        title: 'Password Reset Successful',
        description: 'You can now sign in with your new password.',
      });

      router.push('/login');
    } catch (err: any) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Reset Failed',
        description: err.message || 'An error occurred while resetting your password.',
      });
    }
  };

  if (verifying) {
    return <AuthSkeleton />;
  }

  return (
    <div>
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary">
        <Key aria-hidden="true" className="size-8" weight="duotone" />
      </span>
      <h1 className="heading-4 mt-6 text-center">
        Set a new <Accent>password</Accent>
      </h1>
      <p className="body-6 mt-2 text-center text-lp-muted-fg">
        {error ? 'This reset link cannot be used.' : (
          <>
            For <span className="body-4 text-lp-fg">{email}</span>
          </>
        )}
      </p>

      {!error ? (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="title-4">
              New password
            </label>
            <input id="password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" required disabled={loading} className={fieldClass()} />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="title-4">
              Confirm password
            </label>
            <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" required disabled={loading} className={fieldClass()} />
          </div>
          <button type="submit" disabled={loading} aria-busy={loading} className={cn(buttonClass('primary'), 'w-full py-3 disabled:opacity-60')}>
            {loading ? 'Updating password' : 'Update password'}
          </button>
        </form>
      ) : (
        <div className="mt-8 space-y-4">
          <p role="alert" className="body-6 flex items-start gap-2 rounded-xl border border-lp-destructive/40 p-3 text-lp-destructive">
            <WarningCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" weight="bold" />
            {error}
          </p>
          <button type="button" onClick={() => router.push('/login?tab=login')} className={cn(buttonClass('secondary'), 'w-full')}>
            Back to sign in
          </button>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<AuthSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
