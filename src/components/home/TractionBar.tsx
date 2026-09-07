'use client';

import { useEffect, useRef, useState } from 'react';

// ─── Count-up hook ────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1500, enabled = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled || target === 0) return;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target, duration, enabled]);

  return value;
}

// ─── Stat definition ─────────────────────────────────────────────────────────
interface Stat {
  value: number | null;
  display?: string;
  suffix?: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 500, suffix: '+', label: 'Parts Delivered' },
  { value: 14, suffix: '+', label: 'Materials in Stock' },
  { value: null, display: '72hr', label: 'Avg. Turnaround' },
  { value: null, display: '100%', label: 'NDA Protected' },
];

// ─── Single animated stat ─────────────────────────────────────────────────────
function StatItem({ stat, enabled }: { stat: Stat; enabled: boolean }) {
  const count = useCountUp(stat.value ?? 0, 1500, enabled && stat.value !== null);

  const display =
    stat.value !== null ? `${count}${stat.suffix ?? ''}` : (stat.display ?? '');

  return (
    <div className="flex flex-col items-center gap-1 px-4">
      <span className="text-3xl md:text-4xl font-extrabold text-[#4fd8e8] tabular-nums tracking-tight drop-shadow-sm">
        {display}
      </span>
      <span className="text-xs font-semibold text-[#aab6c9] tracking-widest uppercase text-center">
        {stat.label}
      </span>
    </div>
  );
}

// ─── TractionBar ─────────────────────────────────────────────────────────────
export function TractionBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3, rootMargin: '-50px' }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      id="traction"
      ref={ref}
      className="bg-[#16283e] border-y border-[#2a3a56] py-8 md:py-10 relative z-10"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 2×2 on mobile, 4-col row on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {STATS.map((stat, i) => (
            <div key={stat.label} className="flex items-center">
              <StatItem stat={stat} enabled={visible} />
              {/* Vertical divider — desktop only, not after last */}
              {i < STATS.length - 1 && (
                <div className="hidden md:block w-px h-10 bg-[#2a3a56] mx-auto flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
