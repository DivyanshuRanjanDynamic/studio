'use client';

import { Info } from '@phosphor-icons/react/dist/ssr';
import { getTapName } from '@/config/manufacturing';
import type { TappableHoleGroup } from '@/lib/quoting/tapping';
import type { TapPicks } from '@/hooks/use-cnc-quote';
import { fieldClass } from '@/components/auth/AuthShell';
import { cn } from '@/utils';

const formatInr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const selectClass = cn(fieldClass(), 'lp-select appearance-none pr-10');

/** Thread picker for the CNC instant quote — one row per tappable hole group in the analysis. */
export function CncTappingPicker({
  holes,
  picks,
  onPick,
  tappingCost,
  tappedHoles,
}: {
  holes: readonly TappableHoleGroup[];
  picks: TapPicks;
  onPick: (groupKey: string, pick: { tapId: string; count: number } | null) => void;
  /** Per-part tapping cost from the live quote (before margin, like the other breakdown rows) */
  tappingCost?: number;
  tappedHoles?: number;
}) {
  return (
    <fieldset aria-labelledby="threads-heading" className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span id="threads-heading" className="title-4">Threads and tapping</span>
        {(tappingCost ?? 0) > 0 && (
          <span className="lp-mono rounded-full bg-lp-primary/10 px-2 py-0.5 text-lp-primary">
            +{formatInr(tappingCost ?? 0)}/part · {tappedHoles} hole{tappedHoles === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {holes.length === 0 ? (
        <p className="caption-2 flex items-start gap-3 rounded-xl border border-lp-border bg-lp-card p-4 text-lp-muted-fg">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" weight="bold" />
          No holes on this part match a standard tap drill. Model tapped holes at the tap drill size (for example Ø5.0 mm for
          M6) to get threads priced instantly.
        </p>
      ) : (
        <ul className="space-y-2">
          {holes.map((hole) => {
            const pick = picks[hole.key];
            return (
              <li
                key={hole.key}
                className={cn(
                  'flex flex-col gap-3 rounded-2xl border p-4 transition-colors duration-300 ease-lp sm:flex-row sm:items-center',
                  pick ? 'border-lp-primary/40 bg-lp-primary/5' : 'border-lp-border bg-lp-bg'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="title-4 lp-num">
                    {hole.count} × Ø{hole.diameterMm.toFixed(1)} mm
                  </p>
                  <p className="caption-5 mt-1 text-lp-muted-fg">
                    {hole.through ? 'Through hole' : `Blind, ${hole.depthMm.toFixed(1)} mm deep`}
                  </p>
                </div>
                <select
                  aria-label={`Thread for the Ø${hole.diameterMm.toFixed(1)} mm holes`}
                  value={pick?.tapId ?? ''}
                  onChange={(e) =>
                    onPick(hole.key, e.target.value ? { tapId: e.target.value, count: pick?.count ?? hole.count } : null)
                  }
                  className={cn(selectClass, 'sm:w-44')}
                >
                  <option value="">No thread</option>
                  {hole.tapIds.map((id) => (
                    <option key={id} value={id}>
                      {getTapName(id)}
                    </option>
                  ))}
                </select>
                {pick && hole.count > 1 && (
                  <select
                    aria-label="How many of these holes to tap"
                    value={pick.count}
                    onChange={(e) => onPick(hole.key, { tapId: pick.tapId, count: Number(e.target.value) })}
                    className={cn(selectClass, 'sm:w-32')}
                  >
                    {Array.from({ length: hole.count }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} of {hole.count}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </fieldset>
  );
}
