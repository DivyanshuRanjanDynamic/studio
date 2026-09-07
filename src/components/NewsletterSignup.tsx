'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  let db: ReturnType<typeof useFirestore> | null = null;
  try {
    db = useFirestore();
  } catch {
    // Firebase not available
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setErrorMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    if (!db) {
      setErrorMsg('Service unavailable. Please try again later.');
      setStatus('error');
      return;
    }

    setStatus('loading');

    try {
      await addDoc(collection(db, 'newsletter_subscribers'), {
        email: trimmed.toLowerCase(),
        subscribedAt: serverTimestamp(),
        source: 'blog_sidebar',
      });
      setStatus('success');
      setEmail('');
    } catch (err) {
      console.error('Newsletter signup error:', err);
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="p-6 rounded-2xl border border-green-500/20 bg-green-50 space-y-3 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
        <h4 className="text-sm font-bold text-green-700">You&apos;re in!</h4>
        <p className="text-xs text-green-600 leading-relaxed">
          Manufacturing insights are heading your way.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl border border-slate-200 bg-white space-y-4 border-t-2 border-t-[#2F5FA7] shadow-sm"
    >
      <h4 className="text-sm font-bold text-[#1E3A66]">MechHub Precision</h4>
      <p className="text-xs text-blue-200 leading-relaxed">
        Join 500+ professionals receiving manufacturing insights.
      </p>
      <Input
        type="email"
        className="h-9 text-xs bg-slate-50 border-slate-200 text-[#1E3A66] placeholder:text-blue-100"
        placeholder="you@company.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === 'error') {
            setStatus('idle');
            setErrorMsg('');
          }
        }}
      />
      {status === 'error' && errorMsg && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-500">
          <AlertCircle className="w-3 h-3 shrink-0" /> {errorMsg}
        </p>
      )}
      <Button
        type="submit"
        size="sm"
        disabled={status === 'loading'}
        className="w-full h-9 bg-blue-600 hover:bg-[#1E3A66] text-white font-bold text-[10px] uppercase tracking-wider disabled:opacity-50"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Joining...
          </>
        ) : (
          'Join Now'
        )}
      </Button>
    </form>
  );
}
