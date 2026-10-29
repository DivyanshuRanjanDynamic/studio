'use client';

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Asterisk } from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/utils';

/** Fades/blurs its children up into place the first time they scroll into view. */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn('lp-reveal', inView && 'lp-in', className)}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}

/** Small blue "+ LABEL +" eyebrow used above every section heading. */
export function Tag({ children }: { children: ReactNode }) {
  return <span className="lp-tag">+ {children} +</span>;
}

/**
 * Link into the upload flow: signed-in users go straight to their projects, everyone
 * else registers first. The only auth-aware bit of the landing page, so the sections
 * that use it can stay server components.
 */
export function UploadLink(props: Omit<ComponentProps<typeof Link>, 'href'>) {
  const { user } = useUser();
  const href = user ? '/dashboard?tab=projects' : '/login?tab=register&redirect=/dashboard?tab=projects';
  return <Link {...props} href={href} />;
}

/** Primary/ghost call to action. Omit `href` to link into the upload flow. */
export function CtaButton({
  href,
  children,
  ghost = false,
}: {
  href?: string;
  children: ReactNode;
  ghost?: boolean;
}) {
  const className = cn(
    'group lp-label-mono inline-flex items-center gap-3 rounded-sm px-5 py-3 transition-all duration-300',
    ghost
      ? 'border border-current hover:bg-lp-fg hover:text-lp-bg'
      : 'bg-lp-primary text-lp-primary-fg hover:-translate-y-0.5 hover:shadow-[0_10px_40px_-8px_oklch(var(--lp-primary))]'
  );
  const content = (
    <>
      <span className="transition-transform group-hover:translate-x-1">→</span>
      {children}
      <ArrowUpRight className="size-3.5 transition-transform group-hover:rotate-45" />
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <UploadLink className={className}>{content}</UploadLink>
  );
}

/** Infinite horizontal ticker of capability keywords. */
export function Marquee({ items, dark = false }: { items: string[]; dark?: boolean }) {
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div
      className={cn(
        'overflow-hidden border-y py-4',
        dark ? 'border-lp-primary bg-lp-primary text-lp-primary-fg' : 'border-lp-border'
      )}
    >
      <div className="lp-marquee lp-label-mono flex w-max gap-10 whitespace-nowrap" aria-hidden="true">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            {item}
            <Asterisk className="size-3" />
          </span>
        ))}
      </div>
      <span className="sr-only">{items.join(', ')}</span>
    </div>
  );
}
