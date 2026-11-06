'use client';

import '@/components/home/landing.css';
import { landingFontVars } from '@/components/home/fonts';
import { HomeNav } from '@/components/home/HomeNav';
import { HomeFooter } from '@/components/home/FinalCTA';
import { cn } from '@/utils';

export function V2Shell({
  children,
  className,
  noFooter,
}: {
  children: React.ReactNode;
  className?: string;
  noFooter?: boolean;
}) {
  return (
    <div className={cn('lp-root min-h-screen', landingFontVars)} suppressHydrationWarning>
      <HomeNav />
      {/* pt-24 clears the floating nav (16px offset + 56px bar + gap). */}
      <main id="main" className={cn('pt-24', className)}>
        {children}
      </main>
      {!noFooter && <HomeFooter />}
    </div>
  );
}
