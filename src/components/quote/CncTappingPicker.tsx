'use client';

import { Info } from 'lucide-react';
import { getTapName } from '@/config/manufacturing';
import type { TappableHoleGroup } from '@/lib/quoting/tapping';
import type { TapPicks } from '@/hooks/use-cnc-quote';

const formatInr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fieldClass =
  'bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-sm text-lp-fg font-medium focus:outline-none focus:border-lp-primary focus:ring-4 focus:ring-lp-primary/5 appearance-none custom-select transition-all';

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
    <div className="space-y-3">
      <div className="flex items-center justify-between ml-1">
        <label className="block text-[11px] font-bold text-lp-muted-fg uppercase tracking-widest">
          Threads / Tapping
        </label>
        {(tappingCost ?? 0) > 0 && (
          <span className="lp-label-mono text-lp-primary">
            +{formatInr(tappingCost ?? 0)}/part · {tappedHoles} hole{tappedHoles === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {holes.length === 0 ? (
        <div className="flex items-start gap-3 p-4 rounded-sm bg-lp-card border border-lp-border">
          <Info className="w-4 h-4 text-lp-muted-fg shrink-0 mt-0.5" />
          <p className="text-xs text-lp-muted-fg">
            No holes on this part match a standard tap drill. Model tapped holes at the tap-drill size (for
            example Ø5.0 mm for M6) to get threads priced instantly.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {holes.map((hole) => {
            const pick = picks[hole.key];
            return (
              <div
                key={hole.key}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-sm border transition-colors ${pick ? 'border-lp-primary/40 bg-lp-accent/40' : 'border-lp-border bg-lp-card'
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-lp-fg">
                    {hole.count} × Ø{hole.diameterMm.toFixed(1)} mm
                  </p>
                  <p className="lp-label-mono text-lp-muted-fg mt-0.5">
                    {hole.through ? 'Through hole' : `Blind · ${hole.depthMm.toFixed(1)} mm deep`}
                  </p>
                </div>
                <select
                  aria-label={`Thread for the Ø${hole.diameterMm.toFixed(1)} mm holes`}
                  value={pick?.tapId ?? ''}
                  onChange={(e) =>
                    onPick(hole.key, e.target.value ? { tapId: e.target.value, count: pick?.count ?? hole.count } : null)
                  }
                  className={`${fieldClass} sm:w-44`}
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
                    className={`${fieldClass} sm:w-32`}
                  >
                    {Array.from({ length: hole.count }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n} of {hole.count}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
