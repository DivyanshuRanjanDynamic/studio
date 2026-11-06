'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { MATERIALS } from '@/lib/data/materials';
import { cn } from '@/utils';
import { Accent, Reveal, SectionHeader } from './primitives';
import { buttonClass } from './button';

const CATEGORY_LABELS: Record<string, string> = {
  aluminum: 'Aluminium',
  steel: 'Steel',
  stainless: 'Stainless steel',
  composites: 'Composites',
  plastics: 'Plastics',
  woods: 'Wood',
  '3d_printing': '3D printing',
};

type Material = { name: string; category: string; thicknesses: string; processes: string[]; swatch: string };

const CATALOG: Material[] = MATERIALS.map((m) => ({
  name: m.name,
  category: CATEGORY_LABELS[m.category] ?? m.category,
  thicknesses: m.thicknesses,
  processes: m.processes,
  swatch: (m.colors as { base?: string } | undefined)?.base ?? '#C8CDD2',
})).sort((a, b) => a.name.localeCompare(b.name));

const FILTERS = ['All', ...Array.from(new Set(CATALOG.map((m) => m.category)))];

function MaterialCard({ material }: { material: Material }) {
  const thicknesses = material.thicknesses.split(',').map((t) => t.trim());
  return (
    <article className="flex h-full flex-col rounded-2xl border border-lp-border bg-lp-card p-1">
      <div aria-hidden="true" className="h-16 rounded-xl border border-lp-fg/5" style={{ backgroundColor: material.swatch }} />
      <div className="flex flex-1 flex-col p-4">
        <span className="caption-4 text-lp-muted-fg">{material.category}</span>
        <h3 className="title-2 mt-1">{material.name}</h3>
        <p className="caption-5 lp-num mt-2 text-lp-muted-fg">
          {thicknesses.length > 1 ? `${thicknesses.length} thicknesses, ${thicknesses[0]} to ${thicknesses.at(-1)}` : thicknesses[0]}
        </p>
        <ul className="mt-4 flex flex-wrap gap-2">
          {material.processes.map((p) => (
            <li key={p} className="caption-4 rounded-full bg-lp-bg px-2 py-1">
              {/* Sentence case: "CNC Milling/Turning" → "CNC milling and turning" */}
              {p.replace('/', ' and ').replace(/ (\p{Lu})(\p{Ll})/gu, (_, a: string, b: string) => ` ${a.toLowerCase()}${b}`)}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/**
 * Materials catalogue. On the home page (`preview`) it shows a short list and links to
 * /materials; on /materials it shows every material with category filters.
 */
export function MaterialsCatalog({ headingAs = 'h2', preview = false }: { headingAs?: 'h1' | 'h2'; preview?: boolean }) {
  const [filter, setFilter] = useState('All');
  const visible = preview
    ? CATALOG.slice(0, 8)
    : CATALOG.filter((m) => filter === 'All' || m.category === filter);

  return (
    <section
      id="materials"
      aria-labelledby="materials-heading"
      className={cn('scroll-mt-24 px-4', headingAs === 'h1' ? 'pb-16 pt-8 md:pb-24 md:pt-16' : 'py-16 md:py-24')}
    >
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          as={headingAs}
          id="materials-heading"
          kicker="Materials"
          title={<>{CATALOG.length} materials, <Accent>cut to order</Accent></>}
          lead="Metals, plastics, composites, wood and 3D printing filaments. No minimum quantity, and every material lists the thicknesses and processes it supports."
        />

        {!preview && (
          <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter materials by category">
            {FILTERS.map((f) => {
              const count = f === 'All' ? CATALOG.length : CATALOG.filter((m) => m.category === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={cn(
                    'lp-press button-sm rounded-full border px-3 py-2',
                    filter === f
                      ? 'border-lp-primary bg-lp-primary text-lp-primary-fg'
                      : 'border-lp-border hover:border-lp-fg/40'
                  )}
                >
                  {f} <span className="lp-num opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visible.map((m, i) => (
            <Reveal as="li" key={`${filter}-${m.name}`} delay={(i % 4) * 60}>
              <MaterialCard material={m} />
            </Reveal>
          ))}
        </ul>

        {preview ? (
          <Reveal className="mt-8 flex justify-center">
            <Link href="/materials" className={buttonClass('secondary')}>
              See all {CATALOG.length} materials
              <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
            </Link>
          </Reveal>
        ) : (
          <p className="body-6 mt-8 text-lp-muted-fg">
            Need a grade that is not listed?{' '}
            <Link href="/contact" className="text-lp-primary underline underline-offset-4 hover:opacity-80">
              Ask an engineer
            </Link>{' '}
            and we will source it.
          </p>
        )}
      </div>
    </section>
  );
}
