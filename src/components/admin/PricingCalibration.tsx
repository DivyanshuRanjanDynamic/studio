'use client';

import { useCallback, useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, RefreshCw, Undo2 } from 'lucide-react';
import { getMaterialName } from '@/lib/quoting/materials';
import { DEFAULT_SHOP_LOAD, SURGE_START, calcSurge } from '@/lib/quoting/pricing-engine';
import {
  COOLDOWN_DAYS,
  MAX_STEP,
  MIN_SAMPLES,
  MIN_SAMPLES_TO_APPLY,
  MULTIPLIER_BOUNDS,
  ON_TARGET_TOLERANCE,
  SHOP_LOAD_KEY,
  type CalibrationChange,
  type CalibrationGroup,
  type CalibrationReport,
  type CalibrationVerdict,
  type CalibrationView,
} from '@/lib/quoting/pricing-calibration';
import {
  Chip,
  Message,
  PageHeader,
  TableMessage,
  Td,
  Th,
  THead,
  dialogActionClass,
  dialogCancelClass,
  dialogClass,
  dialogTitleClass,
  fmtDateTime,
  type ChipTone,
} from './admin-ui';

// ═══════════════════════════════════════════════════
// Pricing Calibration — engineer-agreed prices vs the instant prices parts were
// added at (GET /api/v1/admin/pricing-calibration), per service, material and
// batch size; admins apply or undo the price corrections it proposes.
// ═══════════════════════════════════════════════════

const SERVICE_LABELS: Record<string, string> = {
  cnc: 'CNC machining',
  sheet: 'Sheet metal (laser)',
  print: '3D printing',
};

const VERDICT_STYLE: Record<CalibrationVerdict, { label: string; tone: ChipTone }> = {
  insufficient_data: { label: 'Not enough data', tone: 'ink' },
  on_target: { label: 'On target', tone: 'green' },
  adjust: { label: 'Adjust', tone: 'amber' },
};

/** "sheet · ms-crca" → ["Sheet metal (laser)", "CRCA Mild Steel"]; "cnc · 1 pc" → ["CNC machining", "1 pc"] */
export function groupLabel(key: string, view: CalibrationView): [string, string | null] {
  const [service, rest] = key.split(' · ');
  const serviceLabel = SERVICE_LABELS[service] ?? service;
  if (view === 'service' || rest === undefined) return [serviceLabel, null];
  return [serviceLabel, view === 'material' ? getMaterialName(rest) : rest];
}

/** One line for a group key in the log and dialogs: "Sheet metal (laser)" or "CRCA Mild Steel (Sheet metal (laser))" */
export function groupTitle(key: string): string {
  if (key === SHOP_LOAD_KEY) return 'Shop load';
  const [primary, secondary] = groupLabel(key, key.includes(' · ') ? 'material' : 'service');
  return secondary ? `${secondary} · ${primary}` : primary;
}

/** "+20% vs instant" / "−8% vs instant" / "matches instant" */
export function gapLabel(medianRatio: number): string {
  const pct = Math.round((medianRatio - 1) * 100);
  if (pct === 0) return 'matches instant';
  return `${pct > 0 ? '+' : '−'}${Math.abs(pct)}% vs instant`;
}

const x = (m: number) => `×${m.toFixed(2)}`;

export const SAFETY_LIMITS =
  `Safety limits: a direction shows from ${MIN_SAMPLES} engineer-priced parts and Apply needs ${MIN_SAMPLES_TO_APPLY}; ` +
  `within ±${Math.round(ON_TARGET_TOLERANCE * 100)}% counts as on target; one change moves a multiplier by at most ` +
  `±${Math.round(MAX_STEP * 100)}%; multipliers stay between ${MULTIPLIER_BOUNDS.min}× and ${MULTIPLIER_BOUNDS.max}×; ` +
  `a group can change once every ${COOLDOWN_DAYS} days. Every change is logged and can be undone. ` +
  `A material's multiplier wins over its service's.`;

type PendingChange = { action: 'apply' | 'revert'; group: CalibrationGroup };

const CHANGE_BADGE: Record<CalibrationChange['action'], { label: string; tone: ChipTone }> = {
  apply: { label: 'Applied', tone: 'blue' },
  revert: { label: 'Undone', tone: 'ink' },
  shop_load: { label: 'Shop load', tone: 'blue' },
};

const pct = (load: number) => `${Math.round(load * 100)}%`;

/** "No rush surge" / "+10% on Rush & Same-day" */
export function surgeLabel(load: number): string {
  const surge = Math.round((calcSurge(load) - 1) * 100);
  return surge > 0 ? `+${surge}% on Rush & Same-day` : 'No rush surge';
}

function ShopLoadCard({
  shopLoad,
  busy,
  onSave,
}: {
  shopLoad: number | null;
  busy: boolean;
  onSave?: (percent: number) => void;
}) {
  const current = shopLoad ?? DEFAULT_SHOP_LOAD;
  const [value, setValue] = useState(String(Math.round(current * 100)));
  const [confirming, setConfirming] = useState(false);
  useEffect(() => setValue(String(Math.round(current * 100))), [current]);

  const percent = Number(value);
  const valid = value.trim() !== '' && Number.isInteger(percent) && percent >= 0 && percent <= 100;
  const unchanged = valid && percent === Math.round(current * 100);

  return (
    <div className="adm-panel p-6">
      <p className="adm-mono text-lp-primary">Shop load</p>
      <p className="mt-3 text-[56px] font-light leading-none tracking-tight tabular-nums">{valid ? `${percent}%` : pct(current)}</p>
      <p className="mt-4 text-sm leading-relaxed text-lp-muted-fg">
        Above {pct(SURGE_START)}, Rush and Same-day quotes surge — up to +30% at a full shop. Standard and Economy are
        never affected.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span>Now: {pct(current)}</span>
        {shopLoad === null && <span className="text-lp-muted-fg">(default — not set yet)</span>}
        <Chip tone={calcSurge(current) > 1 ? 'amber' : 'ink'}>{surgeLabel(current)}</Chip>
      </div>

      <label htmlFor="shop-load" className="sr-only">
        New shop load (%)
      </label>
      <input
        id="shop-load"
        type="range"
        min={0}
        max={100}
        step={5}
        value={valid ? percent : Math.round(current * 100)}
        onChange={(e) => setValue(e.target.value)}
        className="adm-range mt-6"
        style={{ ['--fill' as string]: `${valid ? percent : Math.round(current * 100)}%` }}
      />
      <div className="mt-2 flex justify-between font-lp-mono text-[10px] text-lp-muted-fg">
        <span>0%</span>
        {valid ? <span>At {percent}%: {surgeLabel(percent / 100)}</span> : <span>Enter a whole number from 0 to 100.</span>}
        <span>100%</span>
      </div>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={!valid || unchanged || busy || !onSave}
        className="adm-btn adm-btn-primary mt-6 h-11"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : null}
        Save shop load
      </button>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent className={dialogClass}>
          <AlertDialogHeader>
            <AlertDialogTitle className={dialogTitleClass}>Set shop load to {valid ? percent : '—'}%?</AlertDialogTitle>
            <AlertDialogDescription>
              {valid ? `${surgeLabel(percent / 100)} for new quotes (now: ${surgeLabel(current).toLowerCase()}).` : ''} Quotes
              already saved keep their price. The change is logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={dialogCancelClass}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={dialogActionClass}
              onClick={() => {
                if (valid) onSave?.(percent);
                setConfirming(false);
              }}
            >
              Set {valid ? percent : ''}%
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface GroupTableProps {
  groups: readonly CalibrationGroup[];
  view: CalibrationView;
  busyKey: string | null;
  onAsk: (pending: PendingChange) => void;
}

function GroupTable({ groups, view, busyKey, onAsk }: GroupTableProps) {
  const cols = view === 'quantity' ? 6 : 7;
  return (
    <div className="adm-panel overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <THead>
          <Th>{view === 'service' ? 'Group' : view === 'material' ? 'Service · material' : 'Service · batch size'}</Th>
          <Th>Parts</Th>
          <Th>Engineers charge</Th>
          <Th>Avg. error</Th>
          {view !== 'quantity' && <Th>Now → target</Th>}
          <Th>Verdict</Th>
          <Th className="w-[230px]">Action</Th>
        </THead>
        <tbody>
          {groups.length === 0 ? (
            <TableMessage colSpan={cols}>No engineer-priced parts yet.</TableMessage>
          ) : (
            groups.map((g) => {
              const [primary, secondary] = groupLabel(g.key, view);
              const verdict = VERDICT_STYLE[g.verdict];
              const busy = busyKey === g.key;
              return (
                <tr key={g.key} className="adm-row border-b border-lp-border last:border-b-0">
                  <Td>
                    <p className="adm-row-title text-sm">{secondary ?? primary}</p>
                    {secondary && <p className="text-xs text-lp-muted-fg">{primary}</p>}
                  </Td>
                  <Td className="font-lp-mono text-xs text-lp-primary">{g.samples}</Td>
                  <Td>
                    <p className="font-lp-mono text-xs">{g.medianRatio.toFixed(2)}×</p>
                    <p className="text-[11px] text-lp-muted-fg">{gapLabel(g.medianRatio)}</p>
                  </Td>
                  <Td className="font-lp-mono text-xs">{g.meanAbsErrorPct.toFixed(1)}%</Td>
                  {view !== 'quantity' && (
                    <Td className="whitespace-nowrap font-lp-mono text-xs">
                      {x(g.currentMultiplier)} <span className="text-lp-muted-fg">→</span> {x(g.targetMultiplier)}
                    </Td>
                  )}
                  <Td>
                    <Chip tone={verdict.tone}>{verdict.label}</Chip>
                  </Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1.5">
                      {g.canApply && g.proposedMultiplier !== null ? (
                        <button
                          type="button"
                          className="adm-btn adm-btn-primary h-8 px-3"
                          disabled={busy}
                          onClick={() => onAsk({ action: 'apply', group: g })}
                        >
                          {busy ? <Loader2 className="size-3 animate-spin" /> : null}
                          Apply {x(g.proposedMultiplier)}
                        </button>
                      ) : (
                        g.blockedReason && <span className="text-xs leading-snug text-lp-primary">{g.blockedReason}</span>
                      )}
                      {g.canRevert && (
                        <button
                          type="button"
                          className="adm-mono inline-flex items-center gap-1.5 py-1 text-lp-muted-fg transition-colors hover:text-lp-primary disabled:opacity-50"
                          disabled={busy}
                          onClick={() => onAsk({ action: 'revert', group: g })}
                        >
                          <Undo2 className="size-3" /> Undo last change
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function ChangeLog({ changes }: { changes: readonly CalibrationChange[] }) {
  return (
    <div className="adm-panel p-6">
      <p className="adm-mono text-lp-primary">Change log</p>
      {changes.length === 0 ? (
        <p className="mt-4 text-sm text-lp-muted-fg">No corrections applied yet — instant prices use the default rates.</p>
      ) : (
        <ul className="mt-4 max-h-[360px] divide-y divide-lp-border overflow-y-auto">
          {changes.map((c) => (
            <li key={c.id} className="grid grid-cols-[120px_1fr] gap-3 py-3 first:pt-0">
              <span className="font-lp-mono text-[10px] text-lp-muted-fg">{fmtDateTime(c.appliedAt)}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Chip tone={CHANGE_BADGE[c.action].tone}>{CHANGE_BADGE[c.action].label}</Chip>
                  <span className="font-lp-mono text-xs">
                    {c.action === 'shop_load' ? `${pct(c.from)} → ${pct(c.to)}` : `${x(c.from)} → ${x(c.to)}`}
                  </span>
                  {c.action !== 'shop_load' && <span className="text-xs">{groupTitle(c.key)}</span>}
                </div>
                <p className="mt-1 text-[11px] text-lp-muted-fg">
                  {c.action === 'apply'
                    ? `${c.samples} parts · target ${c.targetMultiplier !== null ? x(c.targetMultiplier) : '—'}`
                    : c.action === 'shop_load'
                      ? surgeLabel(c.to)
                      : 'restored previous setting'}
                </p>
                <p className="break-all text-[11px] text-lp-primary">{c.appliedBy}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function PricingCalibration() {
  const { user } = useUser();
  const { toast } = useToast();
  const [report, setReport] = useState<CalibrationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/v1/admin/pricing-calibration', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || `Could not load the report (${response.status})`);
      setReport(result as CalibrationReport);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the report');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const change = useCallback(
    async (action: 'apply' | 'revert', key: string) => {
      if (!user) return;
      setBusyKey(key);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`/api/v1/admin/pricing-calibration/${action}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ key }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || `Could not ${action} the correction`);
        const c = result.change as CalibrationChange;
        toast({
          title: action === 'apply' ? 'Correction applied' : 'Correction undone',
          description: `${groupTitle(c.key)}: ${x(c.from)} → ${x(c.to)}. New quotes use it now.`,
        });
        await loadReport();
      } catch (e) {
        toast({
          title: action === 'apply' ? 'Correction not applied' : 'Undo failed',
          description: e instanceof Error ? e.message : 'Please refresh and try again.',
          variant: 'destructive',
        });
      } finally {
        setBusyKey(null);
      }
    },
    [user, toast, loadReport]
  );

  const setShopLoad = useCallback(
    async (percent: number) => {
      if (!user) return;
      setBusyKey(SHOP_LOAD_KEY);
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/v1/admin/pricing-calibration/shop-load', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ percent }),
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) throw new Error(result?.error || 'Could not save the shop load');
        toast({ title: 'Shop load saved', description: `${percent}% — ${surgeLabel(percent / 100).toLowerCase()}.` });
        await loadReport();
      } catch (e) {
        toast({
          title: 'Shop load not saved',
          description: e instanceof Error ? e.message : 'Please refresh and try again.',
          variant: 'destructive',
        });
      } finally {
        setBusyKey(null);
      }
    },
    [user, toast, loadReport]
  );

  return (
    <PricingCalibrationView
      report={report}
      isLoading={isLoading}
      error={error}
      busyKey={busyKey}
      onRefresh={loadReport}
      onApply={(key) => change('apply', key)}
      onRevert={(key) => change('revert', key)}
      onSetShopLoad={setShopLoad}
    />
  );
}

export interface PricingCalibrationViewProps {
  readonly report: CalibrationReport | null;
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly busyKey?: string | null;
  readonly onRefresh: () => void;
  readonly onApply?: (key: string) => void;
  readonly onRevert?: (key: string) => void;
  readonly onSetShopLoad?: (percent: number) => void;
}

const tabClass =
  'relative rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-sm font-normal text-lp-muted-fg shadow-none transition-colors hover:text-lp-fg data-[state=active]:border-lp-fg data-[state=active]:bg-transparent data-[state=active]:text-lp-fg data-[state=active]:shadow-none';

export function PricingCalibrationView({
  report,
  isLoading,
  error,
  busyKey = null,
  onRefresh,
  onApply,
  onRevert,
  onSetShopLoad,
}: PricingCalibrationViewProps) {
  const [pending, setPending] = useState<PendingChange | null>(null);
  const needsAttention = report?.byService.filter((g) => g.verdict === 'adjust').length ?? 0;
  const active = Object.entries(report?.multipliers ?? {}).filter(([, m]) => m !== 1);

  const confirm = () => {
    if (!pending) return;
    if (pending.action === 'apply') onApply?.(pending.group.key);
    else onRevert?.(pending.group.key);
    setPending(null);
  };

  return (
    <div>
      <PageHeader
        tag={report ? `${report.samples} engineer-priced part${report.samples === 1 ? '' : 's'}` : 'Calibration'}
        before="Pricing"
        accent="Calibration"
        description="Engineer quotes vs instant prices. A ratio above 1.00× means engineers charge more than the instant engine. Apply sets a price multiplier for a service or a material; new quotes use it straight away."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {needsAttention > 0 && (
              <Chip tone="amber">
                {needsAttention} service{needsAttention === 1 ? '' : 's'} to adjust
              </Chip>
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="adm-btn adm-btn-ghost h-10 px-3"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        }
      />

      <div className="adm-fade-up mt-8 space-y-2 border-l-2 border-lp-fg bg-lp-muted px-4 py-3" style={{ animationDelay: '320ms' }}>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Active corrections:</span>
          {active.length === 0 ? (
            <span className="text-lp-muted-fg">none — default rates</span>
          ) : (
            active.map(([key, m]) => (
              <Chip key={key} tone="blue">
                {groupTitle(key)} {x(m)}
              </Chip>
            ))
          )}
        </div>
        <p className="text-[11px] leading-relaxed text-lp-muted-fg">{SAFETY_LIMITS}</p>
      </div>

      <div className="adm-fade-up mt-10" style={{ animationDelay: '400ms' }}>
        {isLoading && !report ? (
          <div className="adm-panel py-20">
            <Message loading>Loading calibration data</Message>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 border border-[oklch(58%_0.22_27)] bg-[oklch(58%_0.22_27/0.06)] p-4 text-sm text-[oklch(50%_0.2_27)]">
            <AlertCircle className="size-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : report && report.samples === 0 ? (
          <div className="adm-panel px-6 py-16 text-center">
            <p className="text-sm">No engineer-priced parts yet.</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-lp-muted-fg">
              Each quotation you send for a part that was added with an instant price adds a sample here.
            </p>
          </div>
        ) : report ? (
          <Tabs defaultValue="service">
            <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-lp-border bg-transparent p-0">
              <TabsTrigger value="service" className={tabClass}>By service</TabsTrigger>
              <TabsTrigger value="material" className={tabClass}>By material</TabsTrigger>
              <TabsTrigger value="quantity" className={tabClass}>By batch size</TabsTrigger>
            </TabsList>
            <TabsContent value="service" className="mt-4">
              <GroupTable groups={report.byService} view="service" busyKey={busyKey} onAsk={setPending} />
            </TabsContent>
            <TabsContent value="material" className="mt-4">
              <GroupTable groups={report.byMaterial} view="material" busyKey={busyKey} onAsk={setPending} />
            </TabsContent>
            <TabsContent value="quantity" className="mt-4">
              <GroupTable groups={report.byQuantity} view="quantity" busyKey={busyKey} onAsk={setPending} />
            </TabsContent>
          </Tabs>
        ) : null}
      </div>

      <div className="adm-fade-up mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2" style={{ animationDelay: '480ms' }}>
        {report && <ShopLoadCard shopLoad={report.shopLoad} busy={busyKey === SHOP_LOAD_KEY} onSave={onSetShopLoad} />}
        <ChangeLog changes={report?.changes ?? []} />
      </div>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent className={dialogClass}>
          {pending && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle className={dialogTitleClass}>
                  {pending.action === 'apply'
                    ? `Change ${groupTitle(pending.group.key)} prices?`
                    : `Undo the last ${groupTitle(pending.group.key)} change?`}
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2 text-sm">
                    {pending.action === 'apply' && pending.group.proposedMultiplier !== null ? (
                      <>
                        <p>
                          New instant quotes for {groupTitle(pending.group.key)} will be multiplied by{' '}
                          <strong>{x(pending.group.proposedMultiplier)}</strong> (now {x(pending.group.currentMultiplier)}),
                          about {Math.round((pending.group.proposedMultiplier / pending.group.currentMultiplier - 1) * 100)}%{' '}
                          {pending.group.proposedMultiplier > pending.group.currentMultiplier ? 'higher' : 'lower'}.
                        </p>
                        <p>
                          Based on {pending.group.samples} engineer-priced parts, which point to {x(pending.group.targetMultiplier)}
                          {pending.group.proposedMultiplier !== pending.group.targetMultiplier
                            ? `; this change is capped at ±${Math.round(MAX_STEP * 100)}%.`
                            : '.'}
                        </p>
                      </>
                    ) : (
                      <p>The previous setting is restored for new quotes.</p>
                    )}
                    <p>Quotes already saved keep their price. You can undo this from the table.</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className={dialogCancelClass}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirm} className={dialogActionClass}>
                  {pending.action === 'apply' && pending.group.proposedMultiplier !== null
                    ? `Apply ${x(pending.group.proposedMultiplier)}`
                    : 'Undo change'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
