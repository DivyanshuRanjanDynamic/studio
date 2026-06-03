'use client';

import { ReactNode } from 'react';
import { LandingNav } from './LandingNav';
import { ScrollReveal } from './ScrollReveal';

interface BlogLayoutProps {
  children: ReactNode;
  activeTag?: string;
}

export function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <>
      <LandingNav />
      <div className="min-h-screen bg-[#F8FAFC] pt-8 pb-20 overflow-hidden relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#2F5FA7]/5 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#2F5FA7]/5 rounded-full blur-[100px] -z-10" />

        {/* Grid Pattern */}
        <div className="absolute inset-0 blueprint-grid opacity-[0.03] -z-10" />

        <div className="container mx-auto px-4 relative">
          <ScrollReveal variant="fade-in" duration={800}>
            {children}
          </ScrollReveal>
        </div>
      </div>
    </>
  );
}
