'use client';

import React, { useRef, useEffect, type ReactNode, type CSSProperties } from 'react';
import { useTilt, useCursorGlow, useMagnetic, useCustomCursor } from '@/hooks/use-motion-effects';

/* ── Serif italic accent (like reference site's "Need", "Tomorrow") ── */
export function SerifAccent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={`font-heading italic text-[#2563eb] ${className}`}>
      {children}
    </span>
  );
}

/* ── ✦ Pill badge ("✦ OUR CAPABILITIES ✦") ── */
export function PillBadge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#2563eb]/20 bg-[#2563eb]/5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2563eb] ${className}`}
    >
      <span className="text-[#2563eb]/60">✦</span>
      {children}
      <span className="text-[#2563eb]/60">✦</span>
    </span>
  );
}

/* ── Animated gradient text ── */
export function GradientText({
  children,
  className = '',
  from = '#60a5fa',
  via = '#a78bfa',
  to = '#34d399',
}: {
  children: ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${from}, ${via}, ${to}, ${from})`,
        backgroundSize: '200% 100%',
        animation: 'mh-gradient-shift 4s linear infinite',
      }}
    >
      {children}
    </span>
  );
}

/* ── Glow card with cursor-following spotlight ── */
export function GlowCard({
  children,
  className = '',
  glowColor = 'rgba(96, 165, 250, 0.15)',
}: {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}) {
  const ref = useCursorGlow<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{
        '--glow-color': glowColor,
        '--glow-x': '50%',
        '--glow-y': '50%',
      } as CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(400px circle at var(--glow-x) var(--glow-y), var(--glow-color), transparent 60%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ── 3D tilt card ── */
export function TiltCard({
  children,
  className = '',
  maxDeg = 6,
}: {
  children: ReactNode;
  className?: string;
  maxDeg?: number;
}) {
  const ref = useTilt<HTMLDivElement>(maxDeg);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ── Magnetic button wrapper ── */
export function MagneticWrap({
  children,
  className = '',
  strength = 0.25,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useMagnetic<HTMLDivElement>(strength);
  return (
    <div ref={ref} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}

/* ── Infinite marquee (horizontal) ── */
export function Marquee({
  children,
  speed = 30,
  pauseOnHover = true,
  className = '',
  reverse = false,
}: {
  children: ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden whitespace-nowrap ${className}`}
      style={{ '--marquee-speed': `${speed}s` } as CSSProperties}
    >
      <div
        className={`inline-flex ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''}`}
        style={{
          animation: `mh-marquee var(--marquee-speed) linear infinite`,
          animationDirection: reverse ? 'reverse' : 'normal',
        }}
      >
        <div className="inline-flex shrink-0 items-center gap-8">{children}</div>
        <div className="inline-flex shrink-0 items-center gap-8 ml-8" aria-hidden>{children}</div>
      </div>
    </div>
  );
}

/* ── Glassmorphism panel ── */
export function GlassPanel({
  children,
  className = '',
  blur = 16,
  opacity = 0.6,
}: {
  children: ReactNode;
  className?: string;
  blur?: number;
  opacity?: number;
}) {
  return (
    <div
      className={`${className}`}
      style={{
        background: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        border: '1px solid rgba(255, 255, 255, 0.2)',
      }}
    >
      {children}
    </div>
  );
}

/* ── Custom cursor dot (mount once at page level) ── */
export function CustomCursor() {
  const cursorRef = useCustomCursor();
  return <div ref={cursorRef} className="mh-cursor" />;
}

/* ── Counter animation (numbers tick up) ── */
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasRun.current) {
        hasRun.current = true;
        const start = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = `${prefix}${Math.round(eased * value).toLocaleString('en-IN')}${suffix}`;
          if (t < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        observer.unobserve(el);
      }
    }, { threshold: 0.3 });

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, prefix, suffix, duration]);

  return <span ref={ref} className={className}>{prefix}0{suffix}</span>;
}

/* ── CSS keyframes ── */
export function MotionStyles() {
  return (
    <style>{`
      @keyframes mh-gradient-shift {
        0%   { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }

      @keyframes mh-marquee {
        from { transform: translateX(0); }
        to   { transform: translateX(-50%); }
      }

      /* Reference-style word entrance: blur + slide up */
      @keyframes mh-word-up {
        0%   { opacity: 0; filter: blur(10px); transform: translateY(60%); }
        100% { opacity: 1; filter: none; transform: none; }
      }

      /* Reference-style part/image entrance */
      @keyframes mh-part-in {
        0%   { opacity: 0; filter: blur(14px); transform: translateY(80%) rotate(-15deg) scale(0.8); }
        100% { opacity: 1; filter: none; transform: none; }
      }

      /* Reference-style fade up */
      @keyframes mh-fade-up {
        0%   { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: none; }
      }

      /* Floating animation for decorative elements */
      @keyframes mh-floaty {
        50% { transform: translateY(-14px) rotate(4deg); }
      }

      /* Grow animation for bars/progress */
      @keyframes mh-grow {
        0%   { transform: scaleY(0); }
        100% { transform: scaleY(1); }
      }

      /* Custom cursor */
      .mh-cursor {
        pointer-events: none;
        position: fixed;
        z-index: 60;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #2563eb;
        mix-blend-mode: difference;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
                    background 0.3s ease,
                    margin 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        margin-left: -8px;
        margin-top: -8px;
        display: none;
      }
      @media (hover: hover) and (pointer: fine) {
        .mh-cursor { display: flex; align-items: center; justify-content: center; }
      }
      .mh-cursor.cursor-active {
        width: 56px;
        height: 56px;
        margin-left: -28px;
        margin-top: -28px;
        background: rgba(37, 99, 235, 0.12);
        border: 1.5px solid rgba(37, 99, 235, 0.4);
      }

      /* Skeleton pulse */
      @keyframes mh-skeleton-shimmer {
        from { background-position: 200% 0; }
        to   { background-position: -200% 0; }
      }
      .mh-skeleton {
        background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
        background-size: 200% 100%;
        animation: mh-skeleton-shimmer 1.5s ease infinite;
        border-radius: 0.5rem;
      }

      /* Card hover elevation */
      .mh-card-float {
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                    box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1),
                    border-color 0.3s ease;
      }
      .mh-card-float:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.1);
      }

      /* Parallax marker */
      .mh-parallax-bg {
        will-change: transform;
      }

      /* Hide real cursor on desktop when custom cursor active */
      @media (hover: hover) and (pointer: fine) {
        body:has(.mh-cursor) { cursor: none !important; }
        body:has(.mh-cursor) a,
        body:has(.mh-cursor) button,
        body:has(.mh-cursor) [role="button"] { cursor: none !important; }
      }

      /* Divider line */
      .mh-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(0,0,0,0.08) 50%, transparent);
      }
    `}</style>
  );
}
