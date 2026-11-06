'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';
import '@/components/home/landing.css';
import { landingFontVars } from '@/components/home/fonts';
import { cn } from '@/utils';
import { CustomerGuide, HelpLine, VendorGuide } from './AuthPanel';

/**
 * Layout for sign in, register, verification and password reset: the form on the left,
 * a short guide to MechHub on the right (desktop): how it works, a real quote, and who to call.
 */
export function AuthShell({ children, role = 'customer' }: { children: ReactNode; role?: 'customer' | 'vendor' }) {
  return (
    <div className={cn('lp-root min-h-screen', landingFontVars)}>
      <div className="mx-auto grid min-h-screen max-w-[1440px] lg:grid-cols-[1fr_1.05fr]">
        <div className="flex flex-col px-4 py-6 md:px-12">
          <header className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 rounded-full" aria-label="MechHub home">
              <Image src="/mechhub-logo-small.svg" alt="" width={28} height={28} />
              <span className="title-3">MechHub</span>
            </Link>
            <Link
              href="/"
              className="caption-1 flex items-center gap-2 rounded-full px-3 py-2 text-lp-muted-fg transition-colors duration-300 ease-lp hover:bg-lp-muted hover:text-lp-fg"
            >
              <ArrowLeft aria-hidden="true" className="size-4" weight="bold" />
              Back to home
            </Link>
          </header>

          <main id="main" className="flex flex-1 items-center justify-center py-12">
            <div className="lp-hero-in w-full max-w-[440px]">{children}</div>
          </main>

          <footer className="caption-5 flex flex-wrap gap-x-4 gap-y-2 text-lp-muted-fg">
            <span>© {new Date().getFullYear()} MechHub</span>
            <Link href="/privacy-policy" className="rounded hover:text-lp-fg">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="rounded hover:text-lp-fg">
              Terms
            </Link>
            <Link href="/contact" className="rounded hover:text-lp-fg">
              Help
            </Link>
          </footer>
        </div>

        <aside aria-label={role === 'vendor' ? 'About the MechMaster network' : 'How MechHub works'} className="hidden p-4 lg:block">
          <div className="sticky top-4 flex h-[calc(100vh-32px)] flex-col gap-6 overflow-y-auto rounded-3xl bg-[#0f1219] p-8 xl:p-10 [&>*]:shrink-0">
            {role === 'vendor' ? <VendorGuide /> : <CustomerGuide />}
            <HelpLine className="mt-auto" title={role === 'vendor' ? 'Questions about joining?' : 'Need a hand?'} />
          </div>
        </aside>
      </div>
    </div>
  );
}

/** Input styling shared by the auth and checkout forms. */
export const fieldClass = (invalid = false) =>
  cn(
    'body-6 w-full rounded-xl border bg-lp-bg px-3 py-3 text-lp-fg placeholder:text-lp-muted-fg/60 transition-colors duration-300 ease-lp focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-primary disabled:opacity-60',
    invalid ? 'border-lp-destructive' : 'border-lp-border hover:border-lp-fg/30'
  );

/** Skeleton shaped like the auth card, for loading states. */
export function AuthSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-4">
      <div className="mx-auto h-10 w-56 animate-pulse rounded-full bg-lp-muted" />
      <div className="h-12 animate-pulse rounded-xl bg-lp-muted" />
      <div className="h-10 w-2/3 animate-pulse rounded-lg bg-lp-muted" />
      <div className="h-12 animate-pulse rounded-xl bg-lp-muted" />
      <div className="h-12 animate-pulse rounded-xl bg-lp-muted" />
      <div className="h-12 animate-pulse rounded-full bg-lp-primary/20" />
    </div>
  );
}
