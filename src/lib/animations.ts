/**
 * MechHub animation utilities
 * CSS-based (framer-motion not installed) — uses .mh-reveal / .mh-reveal-fade classes
 * defined in globals.css, triggered by IntersectionObserver.
 */

export type RevealVariant = 'up' | 'fade';

/**
 * Registers an IntersectionObserver that adds `.mh-visible` to elements
 * with `.mh-reveal` or `.mh-reveal-fade` once they enter the viewport.
 * Call this in a useEffect with once: true behaviour.
 */
export function observeReveal(
  elements: (Element | null)[],
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: '-50px' }
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('mh-visible');
        observer.unobserve(entry.target);
      }
    });
  }, options);

  elements.forEach((el) => el && observer.observe(el));

  return () => observer.disconnect();
}

/**
 * Returns a stagger delay string for inline style usage.
 * e.g. staggerDelay(1) → '0.1s'
 */
export function staggerDelay(index: number, base = 0.1): string {
  return `${(index * base).toFixed(2)}s`;
}
