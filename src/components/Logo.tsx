'use client';

import Image from 'next/image';
import { cn } from '@/utils';

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 32 }: LogoProps) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      {/* The detailed mark's rivets turn to noise at small sizes, so use the simplified one there. */}
      <Image
        src={size <= 40 ? '/mechhub-logo-small.svg' : '/mechhub-logo.svg'}
        alt="MechHub Logo"
        fill
        className="object-contain"
      />
    </div>
  );
}
