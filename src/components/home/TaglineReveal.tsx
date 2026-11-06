'use client';

import { useEffect, useRef } from 'react';

const DEFAULT_LINES = ['One upload, one quote,', 'one delivery.', 'From a single prototype', 'to a full production run.'];

/**
 * Tagline reveal (SKILL B11): each word moves from a muted tone to full colour, one
 * at a time, as it crosses a trigger line 40% up from the bottom of the viewport.
 * One IntersectionObserver for all words, no scroll listener. Words stay lit once
 * activated. Reduced motion shows full colour straight away (see landing.css).
 */
export function TaglineReveal({ lines = DEFAULT_LINES }: { lines?: string[] }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const words = ref.current?.querySelectorAll<HTMLElement>('.lp-tagline-word');
    if (!words?.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('lp-on');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -40% 0px' }
    );
    words.forEach((w) => observer.observe(w));
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-label="What MechHub does" className="px-4 py-24">
      <p ref={ref} className="heading-2 mx-auto max-w-[680px]">
        {lines.map((line, li) => (
          <span key={li} className="block">
            {line.split(' ').map((word, wi) => (
              <span key={wi} className="lp-tagline-word">
                {word}{' '}
              </span>
            ))}
          </span>
        ))}
      </p>
    </section>
  );
}
