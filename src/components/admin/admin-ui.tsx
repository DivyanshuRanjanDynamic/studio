'use client';

import { useEffect, useRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';
import './admin.css';

export const inr = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export function fmtDate(value?: string | number | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtDateTime(value?: string | number | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const humanize = (s?: string | null) =>
  (s || '').replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function initials(name?: string | null) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Blue mono tag, word-by-word heading with an italic serif accent, and an optional action on the right. */
export function PageHeader({
  tag,
  before,
  accent,
  after,
  description,
  action,
}: {
  tag?: ReactNode;
  before?: string;
  accent: string;
  after?: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  const words = [
    ...(before ? before.split(' ').map((w) => ({ w, accent: false })) : []),
    ...accent.split(' ').map((w) => ({ w, accent: true })),
    ...(after ? after.split(' ').map((w) => ({ w, accent: false })) : []),
  ];
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0 max-w-4xl">
        {tag != null && (
          <span className="adm-tag adm-fade-up">
            <span className="size-1.5 rounded-full bg-current" />
            {tag}
          </span>
        )}
        <h1 className="adm-title mt-5">
          {words.map(({ w, accent: isAccent }, i) => (
            <span key={i}>
              <span
                className={cn('adm-word', isAccent && 'adm-serif pr-[0.06em]')}
                style={{ animationDelay: `${80 + i * 70}ms` }}
              >
                {w}
              </span>
              {i < words.length - 1 && ' '}
            </span>
          ))}
        </h1>
        {description && (
          <p className="adm-fade-up mt-6 max-w-[520px] text-base leading-relaxed text-lp-muted-fg" style={{ animationDelay: '250ms' }}>
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="adm-fade-up" style={{ animationDelay: '300ms' }}>
          {action}
        </div>
      )}
    </div>
  );
}

export function StatRow({ stats }: { stats: { label: string; value: ReactNode }[] }) {
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-4">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="adm-fade-up border-t border-lp-fg pt-3"
          style={{ animationDelay: `${300 + i * 70}ms` }}
        >
          <p className="adm-mono text-lp-muted-fg">{s.label}</p>
          <p className="mt-2 truncate text-[28px] font-light leading-tight tracking-tight tabular-nums sm:text-[32px]">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function Panel({
  children,
  className,
  delay = 420,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div className={cn('adm-panel adm-fade-up mt-10', className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn('adm-mono whitespace-nowrap px-5 py-4 text-left font-normal text-lp-muted-fg', className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn('px-5 py-4 align-middle', className)}>{children}</td>;
}

/** Table head row with the dark rule underneath. */
export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-lp-fg">{children}</tr>
    </thead>
  );
}

export function TableMessage({
  colSpan,
  loading,
  children,
}: {
  colSpan: number;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-20 text-center">
        <Message loading={loading}>{children}</Message>
      </td>
    </tr>
  );
}

export function Message({ loading, children }: { loading?: boolean; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 text-lp-muted-fg">
      {loading && <Loader2 className="size-5 animate-spin text-lp-primary" />}
      <span className="adm-mono">{children}</span>
    </div>
  );
}

export type ChipTone = 'green' | 'red' | 'amber' | 'blue' | 'ink' | 'muted';

export function Chip({ tone = 'ink', children, className }: { tone?: ChipTone; children: ReactNode; className?: string }) {
  return <span className={cn('adm-chip', `adm-chip-${tone}`, className)}>{children}</span>;
}

export function AdminSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('adm-select', className)} {...props}>
      {children}
    </select>
  );
}

export function SectionLabel({ n, children }: { n: string; children: ReactNode }) {
  return (
    <p className="adm-mono mb-4 text-lp-primary">
      {n} · {children}
    </p>
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="adm-mono mb-2 block text-lp-muted-fg">
      {children}
    </label>
  );
}

/** Blue ring that trails the pointer plus a dot that tracks it exactly. */
export function AdminCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let x = -100;
    let y = -100;
    let rx = -100;
    let ry = -100;
    let raf = 0;
    const root = document.documentElement;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      root.classList.add('adm-cursor-on');
      const target = e.target as Element | null;
      ring.classList.toggle(
        'is-hover',
        !!target?.closest?.('a, button, select, label, [role="button"], [role="tab"], .adm-row, .adm-card')
      );
    };
    const onLeave = () => root.classList.remove('adm-cursor-on');
    const loop = () => {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(loop);
    };

    document.addEventListener('mousemove', onMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
      root.classList.remove('adm-cursor-on');
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="adm-cursor-ring" aria-hidden="true" />
      <div ref={dotRef} className="adm-cursor-dot" aria-hidden="true" />
    </>
  );
}

/** Portaled overlays (dialogs, sheets) render outside the admin root; these classes restyle them. */
export const dialogClass = 'z-[130] rounded-none sm:rounded-none border border-lp-border bg-white font-lp-sans text-lp-fg shadow-[0_30px_80px_-30px_rgba(11,13,18,0.35)]';
export const dialogTitleClass = 'text-2xl font-normal tracking-tight';
export const dialogCancelClass = 'adm-btn adm-btn-ghost h-10 rounded-none';
export const dialogActionClass = 'adm-btn adm-btn-primary h-10 rounded-none';
export const dialogDangerClass = 'adm-btn h-10 rounded-none bg-[oklch(58%_0.22_27)] text-white hover:bg-[oklch(50%_0.22_27)]';
