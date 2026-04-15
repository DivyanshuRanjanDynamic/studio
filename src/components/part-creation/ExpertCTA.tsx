'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight } from 'lucide-react';

interface ExpertCTAProps {
  title?: string;
  description: string;
  buttonText?: string;
  className?: string;
}

export function ExpertCTA({
  title = "Can't find what you need?",
  description,
  buttonText = 'Contact Expert',
  className = '',
}: ExpertCTAProps) {
  return (
    <div
      className={`p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col gap-5 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-blue-50 shrink-0">
          <MessageSquare className="w-5 h-5 text-[#2F5FA7]" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-[#2F5FA7]">
            {title}
          </h4>
          <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase tracking-tight">
            {description}
          </p>
        </div>
      </div>

      <Link href="/contact" className="w-full">
        <Button
          variant="outline"
          className="w-full h-10 bg-white hover:bg-blue-50 text-[#2F5FA7] border-blue-200 font-black uppercase tracking-widest text-[9px] gap-2 rounded-lg shadow-sm transition-all hover:translate-x-1"
        >
          {buttonText}
          <ArrowRight className="w-3 h-3" />
        </Button>
      </Link>
    </div>
  );
}
