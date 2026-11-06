'use client';

import { useLayoutEffect, useRef } from 'react';
import { LogoAnimation } from './LogoAnimation';

const KEY = 'mh-intro';

/**
 * First visit logo intro for the home page. The cover plays the animated logo and lifts
 * away after about three seconds using CSS alone; a click, tap, key press or scroll skips it.
 * Hidden on repeat visits in the same session, and for visitors who prefer reduced motion.
 *
 * Repeat visits: a beforeInteractive script in app/layout.tsx sets html[data-intro-seen]
 * before the first paint, and landing.css hides the cover from that, so it never flashes.
 * The layout effect below covers client side navigation back to the home page.
 */
export function IntroSplash() {
  const ref = useRef<HTMLDivElement>(null);
  const play = useRef<boolean | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Decide once per mount: Strict Mode runs effects twice in development, and the second
    // run would otherwise find the key the first one just wrote and hide the intro.
    if (play.current === null) {
      play.current = true;
      try {
        if (sessionStorage.getItem(KEY)) play.current = false;
        else sessionStorage.setItem(KEY, '1');
      } catch {
        // sessionStorage unavailable (e.g. private browsing): play the intro
      }
    }
    if (!play.current) {
      el.setAttribute('data-seen', '');
      return;
    }

    const skip = () => el.setAttribute('data-skip', '');
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('touchmove', skip, { once: true, passive: true });
    return () => {
      window.removeEventListener('keydown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchmove', skip);
    };
  }, []);

  return (
    <div
      id="mh-intro"
      ref={ref}
      aria-hidden="true"
      className="lp-intro"
      onClick={() => ref.current?.setAttribute('data-skip', '')}
      suppressHydrationWarning
    >
      <LogoAnimation />
    </div>
  );
}
