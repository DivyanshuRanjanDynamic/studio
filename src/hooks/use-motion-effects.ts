'use client';

import { useRef, useEffect, useCallback, useState, type RefObject, type CSSProperties } from 'react';

// ═══════════════════════════════════════════════════
// Motion hooks — pure CSS + JS, no external libraries
// ═══════════════════════════════════════════════════

/** Magnetic pull: element gently follows the cursor when hovering nearby */
export function useMagnetic<T extends HTMLElement>(strength = 0.3): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onLeave = () => {
      el.style.transform = '';
      el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { el.style.transition = ''; }, 500);
    };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [strength]);

  return ref;
}

/** 3D tilt: card tilts in perspective based on cursor position */
export function useTilt<T extends HTMLElement>(maxDeg = 8, perspective = 800): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.transformStyle = 'preserve-3d';
    el.style.willChange = 'transform';

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(${perspective}px) rotateX(${-y * maxDeg}deg) rotateY(${x * maxDeg}deg) scale3d(1.02, 1.02, 1.02)`;
    };
    const onLeave = () => {
      el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = `perspective(${perspective}px) rotateX(0) rotateY(0) scale3d(1,1,1)`;
      setTimeout(() => { el.style.transition = ''; }, 600);
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, [maxDeg, perspective]);

  return ref;
}

/** Cursor-following glow border (bento grid spotlight) */
export function useCursorGlow<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
    };
    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return ref;
}

/** Parallax: translateY proportional to scroll, multiplied by speed (-1 to 1) */
export function useParallax<T extends HTMLElement>(speed = 0.15): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      const offset = (center - viewCenter) * speed;
      el.style.transform = `translateY(${offset}px)`;
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [speed]);

  return ref;
}

/** Custom cursor: morphs a dot into a circle/text on hover targets */
export function useCustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor || typeof window === 'undefined') return;
    // Only on desktop (no touch)
    if ('ontouchstart' in window) return;

    let x = 0, y = 0, tx = 0, ty = 0;
    let raf = 0;

    const lerp = () => {
      x += (tx - x) * 0.15;
      y += (ty - y) * 0.15;
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      raf = requestAnimationFrame(lerp);
    };

    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    const onEnterClickable = () => cursor.classList.add('cursor-active');
    const onLeaveClickable = () => cursor.classList.remove('cursor-active');

    document.addEventListener('mousemove', onMove);
    raf = requestAnimationFrame(lerp);

    // Attach to clickable things
    const attach = () => {
      document.querySelectorAll('a, button, [role="button"], .cursor-hover').forEach((el) => {
        el.addEventListener('mouseenter', onEnterClickable);
        el.addEventListener('mouseleave', onLeaveClickable);
      });
    };
    attach();
    const mo = new MutationObserver(attach);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, []);

  return cursorRef;
}

/** Returns scroll progress (0-1) of an element through the viewport */
export function useScrollProgress<T extends HTMLElement>(): [RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const start = window.innerHeight;
      const end = -rect.height;
      const p = Math.min(1, Math.max(0, (start - rect.top) / (start - end)));
      setProgress(p);
    };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  return [ref, progress];
}
