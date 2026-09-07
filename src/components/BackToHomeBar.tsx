import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/utils';

interface BackToHomeBarProps {
  className?: string;
  href?: string;
  label?: string;
}

export function BackToHomeBar({
  className,
  href = '/',
  label = 'Back to Home',
}: BackToHomeBarProps) {
  return (
    <div className={cn('container mx-auto px-4 pt-24 pb-4', className)}>
      <Link
        href={href}
        className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-blue-200 hover:text-[#2F5FA7] transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        {label}
      </Link>
    </div>
  );
}

