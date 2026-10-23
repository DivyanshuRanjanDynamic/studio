'use client';

import { ReactNode } from 'react';
import { V2Shell } from './V2Shell';

export function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <V2Shell>
      <article className="mx-auto max-w-4xl px-4 sm:px-5 pb-20 pt-6">
        {children}
      </article>
    </V2Shell>
  );
}
