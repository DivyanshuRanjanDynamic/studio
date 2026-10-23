'use client';

import { ReactNode } from 'react';
import { V2Shell } from './V2Shell';

interface BlogLayoutProps {
  children: ReactNode;
  activeTag?: string;
}

export function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <V2Shell>
      <div className="min-h-screen pb-20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
          {children}
        </div>
      </div>
    </V2Shell>
  );
}
