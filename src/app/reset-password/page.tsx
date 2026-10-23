'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/firebase';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
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
import { Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { V2Shell } from '@/components/V2Shell';

const inputCls =
  'h-12 border-lp-border bg-lp-card text-lp-fg placeholder:text-lp-muted-fg/40 focus:border-lp-primary focus:ring-lp-primary/10 rounded-sm text-sm';

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
    return (
      <div className="w-full max-w-md border border-lp-border bg-lp-bg p-8 text-center mx-auto">
        <Loader2 className="size-8 animate-spin mx-auto text-lp-primary mb-4" />
        <p className="text-sm text-lp-muted-fg">Verifying your secure link...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md border-lp-border bg-lp-bg shadow-none relative overflow-hidden mx-auto rounded-sm">
      <div className="absolute top-0 left-0 w-full h-0.5 bg-lp-primary" />
      <CardHeader className="space-y-1 pb-4">
        <div className="flex justify-center mb-2">
          <div className="flex size-12 items-center justify-center bg-lp-accent text-lp-primary">
            <KeyRound className="size-6" />
          </div>
        </div>
        <CardTitle className="text-2xl text-center font-medium tracking-tight">Reset Password</CardTitle>
        <CardDescription className="text-center text-lp-muted-fg">
          {error ? 'There was a problem with your request.' : `Create a new password for ${email}`}
        </CardDescription>
      </CardHeader>

      {!error ? (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="lp-label-mono text-lp-primary">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className={inputCls}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="lp-label-mono text-lp-primary">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                className={inputCls}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              className="lp-label-mono w-full h-12 bg-lp-primary text-lp-primary-fg hover:bg-lp-primary/90 rounded-sm transition-all active:scale-[0.98]"
              type="submit"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {loading ? 'Updating...' : 'Reset Password'}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <CardContent className="flex flex-col gap-4 items-center pb-8 p-6">
          <p className="text-sm text-lp-destructive font-medium text-center">{error}</p>
          <Button
            variant="outline"
            className="mt-4 border-lp-border w-full rounded-sm hover:bg-lp-accent"
            onClick={() => router.push('/login')}
          >
            Return to Login
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <V2Shell>
      <div className="flex-1 flex justify-center items-center px-4 py-20">
        <Suspense
          fallback={
            <div className="w-full max-w-md border border-lp-border bg-lp-bg p-8 text-center mx-auto">
              <Loader2 className="size-8 animate-spin mx-auto text-lp-primary" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </V2Shell>
  );
}
