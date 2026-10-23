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
      className={`p-5 bg-lp-accent rounded-sm border border-lp-border flex flex-col gap-4 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-sm bg-lp-card flex items-center justify-center border border-lp-border shrink-0">
          <MessageSquare className="w-5 h-5 text-lp-primary" />
        </div>
        <div className="space-y-1.5">
          <h4 className="lp-label-mono text-lp-primary">
            {title}
          </h4>
          <p className="text-xs text-lp-muted-fg leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <Link href="/contact" className="w-full">
        <Button
          variant="outline"
          className="w-full h-10 bg-lp-card hover:bg-lp-accent text-lp-primary border-lp-border lp-label-mono gap-2 rounded-sm shadow-sm transition-all hover:translate-x-1"
        >
          {buttonText}
          <ArrowRight className="w-3 h-3" />
        </Button>
      </Link>
    </div>
  );
}
