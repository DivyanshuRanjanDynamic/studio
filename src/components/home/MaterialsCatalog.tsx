'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { MATERIALS } from '@/lib/data/materials';
import { cn } from '@/utils';
import { Reveal, Tag } from './primitives';

const CATEGORY_LABELS: Record<string, string> = {
  aluminum: 'Aluminium',
  steel: 'Steel',
  stainless: 'Stainless',
  composites: 'Composites',
  plastics: 'Plastics',
  woods: 'Woods',
  '3d_printing': '3D Printing',
};

const SWATCHES: Record<string, string> = {
  Aluminium: 'lp-sw-aluminium',
  Steel: 'lp-sw-steel',
  Stainless: 'lp-sw-stainless',
  Composites: 'lp-sw-carbon',
  Plastics: 'lp-sw-acrylic',
  Woods: 'lp-sw-wood',
  '3D Printing': 'lp-sw-print',
};

const FILTERS = ['All', 'Aluminium', 'Steel', 'Stainless', 'Composites', 'Plastics', 'Woods', '3D Printing'];
const POPULAR = ['ABS', 'Stainless Steel 304'];

type Material = { name: string; category: string; thicknesses: string; processes: string[] };

const CATALOG: Material[] = MATERIALS.map((m) => ({
  name: m.name,
  category: CATEGORY_LABELS[m.category] ?? m.category,
  thicknesses: m.thicknesses,
  processes: m.processes,
})).sort((a, b) => a.name.localeCompare(b.name));

/** Custom cursor + tilt only for precise hovering pointers, and never under reduced motion. */
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setFine(pointer.matches && !motion.matches);
    update();
    pointer.addEventListener('change', update);
    motion.addEventListener('change', update);
    return () => {
      pointer.removeEventListener('change', update);
      motion.removeEventListener('change', update);
    };
  }, []);
  return fine;
}

function MaterialTile({
  material,
  index,
  tilt,
  onHover,
}: {
  material: Material;
  index: number;
  tilt: boolean;
  onHover: (name: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || !tilt) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateY(-6px)`;
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseEnter={() => onHover(material.name)}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.transform = '';
        onHover(null);
      }}
      className="group relative flex flex-col overflow-hidden rounded-sm border border-lp-ink-fg/10 bg-lp-ink-fg/[0.03] transition-[transform,border-color] duration-300 ease-out animate-in fade-in zoom-in-95 slide-in-from-bottom-4 fill-mode-both hover:border-lp-primary"
      style={{ animationDelay: `${index * 45}ms`, animationDuration: '600ms' }}
    >
      <div className={cn('relative h-36 overflow-hidden', SWATCHES[material.category] ?? 'lp-sw-steel')}>
        <div className="lp-sw-sheen absolute inset-0 transition-transform duration-700 group-hover:scale-110" />
        <span className="lp-label-mono absolute left-3 top-3 text-lp-ink/70 mix-blend-difference">
          {String(index + 1).padStart(2, '0')}
        </span>
        {POPULAR.includes(material.name) && <span className="lp-tag absolute right-3 top-3">Popular</span>}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg leading-tight">{material.name}</h3>
          <span className="lp-label-mono opacity-50">{material.category}</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {material.thicknesses.split(',').map((t) => (
            <span
              key={t}
              className="rounded-[2px] bg-lp-ink-fg/5 px-1.5 py-0.5 font-lp-mono text-[0.65rem] opacity-80 transition-colors group-hover:bg-lp-primary/30"
            >
              {t.trim()}
            </span>
          ))}
        </div>
        <div className="lp-label-mono mt-auto flex flex-wrap gap-x-3 border-t border-lp-ink-fg/10 pt-3 text-lp-primary">
          {material.processes.map((p) => (
            <span key={p}>→ {p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MaterialsCatalog({ headingAs: Heading = 'h2' }: { headingAs?: 'h1' | 'h2' }) {
  const [filter, setFilter] = useState('All');
  const [hovered, setHovered] = useState<string | null>(null);
  const [inside, setInside] = useState(false);
  const fine = useFinePointer();
  const cursorRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  const visible = CATALOG.filter((m) => filter === 'All' || m.category === filter);
  const hoveredMaterial = CATALOG.find((m) => m.name === hovered);

  // Lerp the cursor bubble towards the pointer while it is inside the section.
  useEffect(() => {
    if (!fine || !inside) return;
    let frame = 0;
    const tick = () => {
      current.current.x += (target.current.x - current.current.x) * 0.18;
      current.current.y += (target.current.y - current.current.y) * 0.18;
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${current.current.x}px, ${current.current.y}px) translate(-50%, -50%)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [fine, inside]);

  return (
    <section
      id="materials"
      onMouseMove={(e) => {
        target.current = { x: e.clientX, y: e.clientY };
      }}
      onMouseEnter={(e) => {
        // Start the bubble at the pointer instead of sliding in from the corner.
        target.current = current.current = { x: e.clientX, y: e.clientY };
        setInside(true);
      }}
      onMouseLeave={() => setInside(false)}
      className={cn('relative scroll-mt-16 bg-lp-ink py-28 text-lp-ink-fg', fine && 'lp-cursor-none')}
    >
      {fine && (
        <div
          ref={cursorRef}
          aria-hidden="true"
          className={cn(
            'pointer-events-none fixed left-0 top-0 z-[60] flex items-center justify-center rounded-full bg-lp-primary text-lp-primary-fg transition-[width,height,opacity] duration-300',
            inside ? 'opacity-100' : 'opacity-0',
            hoveredMaterial ? 'size-32' : 'size-4'
          )}
        >
          {hoveredMaterial && (
            <div className="px-3 text-center animate-in fade-in zoom-in-75 duration-300">
              <div className="text-sm leading-tight">{hoveredMaterial.name}</div>
              <div className="mt-1 font-lp-mono text-[0.55rem] uppercase opacity-80">
                {hoveredMaterial.thicknesses === 'Any geometry'
                  ? 'Any geometry'
                  : `${hoveredMaterial.thicknesses.split(',').length} thicknesses`}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mx-auto max-w-[1400px] px-4 sm:px-5">
        <Reveal>
          <Tag>Industrial Catalog</Tag>
        </Reveal>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
          <Reveal delay={100}>
            <Heading className="text-[3rem] leading-[0.95] tracking-tight md:text-[4.5rem]">
              {CATALOG.length}+ Materials <span className="font-lp-serif italic opacity-70">in Stock</span>
            </Heading>
          </Reveal>
          <Reveal delay={150}>
            <p className="max-w-xs text-sm opacity-60">
              Every material is stocked, cut to order, and shipped fast. No minimums. No surprises.
            </p>
          </Reveal>
        </div>

        <div className="sticky top-16 z-10 -mx-4 mt-10 bg-lp-ink/90 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="lp-label-mono mr-2 opacity-50">Filter by</span>
            {FILTERS.map((f) => {
              const count = f === 'All' ? CATALOG.length : CATALOG.filter((m) => m.category === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={cn(
                    'lp-label-mono relative overflow-hidden rounded-sm border px-3 py-1.5 transition-all duration-300',
                    filter === f
                      ? 'scale-105 border-lp-primary bg-lp-primary text-lp-primary-fg'
                      : 'border-lp-ink-fg/20 hover:border-lp-ink-fg'
                  )}
                >
                  {f} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
            <span className="lp-label-mono ml-auto opacity-50">
              Showing {visible.length} / {CATALOG.length}
            </span>
          </div>
        </div>

        <div key={filter} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((m, i) => (
            <MaterialTile key={m.name} material={m} index={i} tilt={fine} onHover={setHovered} />
          ))}
        </div>

        <div className="lp-label-mono mt-12 flex flex-wrap gap-6 opacity-70">
          {['High quality materials', 'Stocked', 'Cut to order', 'Fast shipping'].map((item) => (
            <span key={item}>✓ {item}</span>
          ))}
          <span className="ml-auto">
            Precision Materials for Real Builds · From metals to plastics, we got you covered.
          </span>
          <Link href="/materials" className="underline-offset-4 transition-colors hover:text-lp-primary hover:underline">
            → Full material catalog
          </Link>
        </div>
      </div>

      <div className="mt-16 overflow-hidden border-y border-lp-ink-fg/10 py-6" aria-hidden="true">
        <div
          className="lp-marquee flex w-max gap-12 whitespace-nowrap text-5xl tracking-tight md:text-7xl"
          style={{ animationDuration: '70s' }}
        >
          {[...CATALOG, ...CATALOG].map((m, i) => (
            <span
              key={i}
              className={cn(
                'transition-colors',
                hovered === m.name ? 'text-lp-primary' : 'text-lp-ink-fg/20',
                i % 2 && 'font-lp-serif italic'
              )}
            >
              {m.name} ✱
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
