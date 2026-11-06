'use client';

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { useUser } from '@/firebase/provider';
import { cn } from '@/utils';
import { buttonClass, type ButtonVariant } from './button';

export { buttonClass };

/** Rises 32px and fades in the first time it scrolls into view (once, never replayed). */
export function Reveal({
  children,
  className = '',
  delay = 0,
  as: Element = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'li' | 'article';
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
    <Element
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as any}
      className={cn('lp-reveal', inView && 'lp-in', className)}
      style={{ transitionDelay: delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Element>
  );
}

/** Small blue chip kicker above a section heading: ‹ Label ›. */
export function Tag({ children, inverted = false }: { children: ReactNode; inverted?: boolean }) {
  return (
    <span
      className={cn(
        'lp-mono inline-flex items-center gap-2 rounded px-2 py-1',
        inverted ? 'bg-lp-primary-fg text-lp-primary' : 'bg-lp-primary text-lp-primary-fg'
      )}
    >
      <span aria-hidden="true" className="opacity-60">
        ‹
      </span>
      {children}
      <span aria-hidden="true" className="opacity-60">
        ›
      </span>
    </span>
  );
}

/** The serif italic accent word inside a heading. */
export function Accent({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return <span className={cn('lp-accent', light && 'lp-accent-light')}>{children}</span>;
}

/** Kicker, heading and lead paragraph shared by every section. */
export function SectionHeader({
  kicker,
  title,
  lead,
  center = false,
  inverted = false,
  as: Heading = 'h2',
  id,
}: {
  kicker?: string;
  title: ReactNode;
  lead?: ReactNode;
  center?: boolean;
  inverted?: boolean;
  as?: 'h1' | 'h2';
  id?: string;
}) {
  return (
    <Reveal className={cn('max-w-[680px]', center && 'mx-auto text-center')}>
      {kicker && <Tag inverted={inverted}>{kicker}</Tag>}
      <Heading id={id} className={cn('heading-2', kicker && 'mt-4')}>
        {title}
      </Heading>
      {lead && (
        <p className={cn('body-3 mt-4', inverted ? 'text-lp-ink-fg/70' : 'text-lp-muted-fg')}>{lead}</p>
      )}
    </Reveal>
  );
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

/** Main call to action. Omit `href` to link into the upload flow. */
export function CtaButton({
  href,
  children,
  variant = 'primary',
  arrow = true,
  className,
}: {
  href?: string;
  children: ReactNode;
  variant?: ButtonVariant;
  arrow?: boolean;
  className?: string;
}) {
  const cls = cn(buttonClass(variant, 'md', arrow), className);
  const content = (
    <>
      {children}
      {arrow && (
        <span
          aria-hidden="true"
          className={cn(
            'flex size-8 items-center justify-center rounded-full',
            variant === 'primary' || variant === 'inverted-secondary'
              ? 'bg-lp-primary-fg/15'
              : 'bg-lp-primary text-lp-primary-fg'
          )}
        >
          <ArrowRight
            className="size-4 transition-transform duration-300 ease-lp group-hover:translate-x-0.5"
            weight="bold"
          />
        </span>
      )}
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {content}
    </Link>
  ) : (
    <UploadLink className={cls}>{content}</UploadLink>
  );
}

/**
 * Static row of capability keywords. Previously an infinite ticker; the design system
 * bans linear looping motion, so it now wraps instead of scrolling.
 */
export function Marquee({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <div className={cn('border-y py-4', dark ? 'border-lp-ink bg-lp-ink text-lp-ink-fg' : 'border-lp-border')}>
      <ul className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4">
        {items.map((item) => (
          <li key={item} className="caption-1 opacity-80">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
