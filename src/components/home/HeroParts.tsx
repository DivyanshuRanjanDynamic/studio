'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

const P = {
  1: { src: '/home/part-1.png', w: 408 },
  2: { src: '/home/part-2.png', w: 323 },
  3: { src: '/home/part-3.png', w: 259 },
  4: { src: '/home/part-4.png', w: 399 },
  5: { src: '/home/part-5.png', w: 290 },
};

// Conveyor order (each part appears twice) and each part's resting angle.
const ITEMS = [
  { ...P[5], base: -24 },
  { ...P[1], base: -8 },
  { ...P[2], base: 28 },
  { ...P[3], base: -4 },
  { ...P[4], base: 10 },
  { ...P[5], base: 30 },
  { ...P[1], base: 6 },
  { ...P[2], base: -20 },
  { ...P[3], base: 8 },
  { ...P[4], base: -12 },
];

/** Gap between parts as % of the strip width (wider on phones so parts stay readable). */
const SPACING = { desktop: 17, mobile: 34 };
/** Drift speed in % of the strip width per second. */
const SPEED = 3.2;

type Pose = { x: number; y: number; rotate: number; scale: number };

/**
 * Where part `i` sits at time `t` (seconds): the parts ride a shallow arc from right to
 * left, lowest and largest in the middle, turning as they travel, like a turntable seen
 * from slightly above. Positions wrap so the loop is seamless.
 */
function pose(i: number, t: number, spacing: number, arc: number): Pose {
  const loop = ITEMS.length * spacing;
  const margin = (loop - 100) / 2;
  const raw = (i * spacing - t * SPEED) % loop;
  const x = (raw < 0 ? raw + loop : raw) - margin;
  const edge = Math.min(1, ((x - 50) / 60) ** 2);
  const bob = Math.sin(t * 0.9 + i * 1.7) * 4;
  return {
    x,
    y: (1 - edge) * arc + bob,
    rotate: ITEMS[i].base + (50 - x) * 0.35,
    scale: 0.72 + 0.34 * (1 - edge),
  };
}

const transformOf = (p: Pose) => `translate3d(${p.x}%, ${p.y}px, 0)`;
const partTransformOf = (p: Pose) => `translateX(-50%) rotate(${p.rotate}deg) scale(${p.scale})`;

/**
 * Hero parts conveyor (reference: precision CNC storefront hero). One rAF loop moves the
 * parts and lifts the strip as the page scrolls. It only runs while the hero is on
 * screen; under reduced motion the parts stay in their starting positions.
 */
export function HeroParts() {
  const stripRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const partRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const mobile = window.matchMedia('(max-width: 767px)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const place = (t: number) => {
      const spacing = mobile.matches ? SPACING.mobile : SPACING.desktop;
      const arc = strip.clientHeight * 0.24;
      ITEMS.forEach((_, i) => {
        const p = pose(i, t, spacing, arc);
        const item = itemRefs.current[i];
        const part = partRefs.current[i];
        if (item) item.style.transform = transformOf(p);
        if (part) part.style.transform = partTransformOf(p);
      });
    };

    place(0);
    if (reduced) return;

    let frame = 0;
    let visible = true;
    let start = performance.now();
    let elapsed = 0;

    const tick = (now: number) => {
      const t = elapsed + (now - start) / 1000;
      place(t);
      const lift = Math.min(window.scrollY, window.innerHeight) * 0.18;
      strip.style.transform = `translate3d(0, ${-lift}px, 0)`;
      frame = visible ? requestAnimationFrame(tick) : 0;
    };

    const observer = new IntersectionObserver(([entry]) => {
      const now = performance.now();
      if (entry?.isIntersecting && !visible) {
        visible = true;
        start = now;
        frame = requestAnimationFrame(tick);
      } else if (!entry?.isIntersecting && visible) {
        visible = false;
        elapsed += (now - start) / 1000;
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(strip);
    frame = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="lp-hero-in relative" style={{ animationDelay: '300ms' }}>
      <div ref={stripRef} className="relative mx-auto h-25 w-full max-w-[1440px] will-change-transform md:h-96">
        <ul aria-label="Parts made on MechHub" className="absolute inset-0">
          {ITEMS.map((item, i) => {
            const p = pose(i, 0, SPACING.desktop, 80);
            return (
              <li
                key={i}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                aria-hidden={i >= 5 || undefined}
                className="absolute left-0 top-0 w-full will-change-transform"
                style={{ transform: transformOf(p) }}
              >
                <div
                  ref={(el) => {
                    partRefs.current[i] = el;
                  }}
                  className="inline-block will-change-transform"
                  style={{ transform: partTransformOf(p) }}
                >
                  <Image
                    src={item.src}
                    alt={i >= 5 ? '' : 'Precision CNC part made by a MechMaster'}
                    width={item.w}
                    height={640}
                    // Lazy on purpose: React preloads eager images during SSR. Each image is
                    // used twice, so the first copy on screen loads it for the second.
                    loading="lazy"
                    sizes="(min-width: 768px) 176px, 96px"
                    className="h-28 w-auto max-w-none object-contain md:h-60"
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
