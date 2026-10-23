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
      <main className={cn('pt-20', className)}>{children}</main>
      {!noFooter && <HomeFooter />}
    </div>
  );
}
