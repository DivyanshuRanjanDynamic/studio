'use client';

import React, { useState, useRef, useEffect, Suspense, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowsClockwise,
  CaretDown,
  CaretLeft,
  CaretUp,
  Check,
  CheckCircle,
  Clock,
  Cube,
  FileCode,
  Gear,
  Info,
  Lightning,
  LockKey,
  ShareNetwork,
  ShoppingCartSimple,
  SignIn,
  Stack,
  Trash,
  UploadSimple,
  Warning,
  WarningCircle,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { V2Shell } from '@/components/V2Shell';
import { useUser } from '@/firebase';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useSheetQuote } from '@/hooks/use-sheet-quote';
import { useCncQuote } from '@/hooks/use-cnc-quote';
import { useQuoteCartContext } from '@/context/QuoteCartContext';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { useSavedQuote } from '@/hooks/use-saved-quote';
import { isCncQuote, isSheetQuoteResult } from '@/lib/quoting/pricing-engine';
import { getSheetMaterial } from '@/lib/quoting/sheet-rates';
import { ErrorCode } from '@/utils/errors';
import {
  CNC_PROCESS_LABELS,
  formatCncStock,
  DEFAULT_CNC_SHOP_RATES,
  getCncMaterialData,
} from '@/lib/quoting/cnc-materials';
import { getFinishRate, getMaterialById, getMaterialName, getTurnaroundOption } from '@/lib/quoting/materials';
import type { SaveQuoteInput } from '@/services/quoteApi.service';
import { CncTappingPicker } from '@/components/quote/CncTappingPicker';
import { getTapName } from '@/config/manufacturing';
import type { AnyQuoteResult, DFMIssue, QuantityTier, QuoteProcessMode } from '@/types/quoting';
import { Accent, Tag } from '@/components/home/primitives';
import { buttonClass } from '@/components/home/button';
import { fieldClass } from '@/components/auth/AuthShell';
import { cn } from '@/utils';

// ═══════════════════════════════════════════════════
// Instant Quote Page — File Upload → Configure → Review
// ═══════════════════════════════════════════════════

type Step = 'upload' | 'configure' | 'review';

const PROCESS_OPTIONS: ReadonlyArray<{
  mode: QuoteProcessMode;
  label: string;
  hint: string;
  Icon: typeof Lightning;
}> = [
  { mode: 'laser', label: 'Laser cutting', hint: 'Sheet parts', Icon: Lightning },
  { mode: 'cnc_milling', label: 'CNC milling', hint: 'Prismatic parts', Icon: Gear },
  { mode: 'cnc_turning', label: 'CNC turning', hint: 'Round parts', Icon: ArrowsClockwise },
];

const formatInr = (n: number): string =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatTime = (ms: number): string =>
  new Date(ms).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const formatDuration = (min: number): string => {
  if (!min || isNaN(min) || min <= 0) return '0 min';
  if (min < 1) return `${Math.round(min * 60)}s`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  const s = Math.round((min * 60) % 60);
  if (h === 0) {
    return s > 0 && m < 5 ? `${m}m ${s}s` : `${m} min`;
  }
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};

const isSharedLoadPending = (shareRef: string | null, status: string): boolean =>
  shareRef !== null && (status === 'loading' || status === 'error');

/** Flat blank of a sheet part: its outline box when flat, else the unfolded area */
const formatBlank = (a: { isFlat: boolean; boundingBox: { x: number; y: number }; flatAreaMm2: number }): string =>
  a.isFlat
    ? `${a.boundingBox.x.toFixed(1)} × ${a.boundingBox.y.toFixed(1)} mm`
    : `${(a.flatAreaMm2 / 100).toFixed(1)} cm² unfolded`;

/** Specification rows read from the quote itself, so shared quotes render too */
function quoteSpecRows(q: AnyQuoteResult): ReadonlyArray<readonly [string, string]> {
  const { materialId, finishType, quantity, turnaround } = q.parameters;
  const processRows: ReadonlyArray<readonly [string, string]> = isCncQuote(q)
    ? [
      ['Process', CNC_PROCESS_LABELS[q.process]],
      ['Stock', formatCncStock(q.analysis.stock)],
      ['Setups', `${q.analysis.setups.count} (${q.analysis.setups.directions.join(', ')})`],
      ['Machining Time', `${formatDuration(q.breakdown.cycleTimeMin)}/part`],
      ['Setup Time', `${formatDuration(q.analysis.setupTimeMin)} (amortized)`],
      ...(q.parameters.taps?.length
        ? ([['Threads', q.parameters.taps.map((t) => `${t.count}× ${getTapName(t.tapId)}`).join(', ')]] as const)
        : []),
    ]
    : isSheetQuoteResult(q)
      ? [
        ['Thickness', `${q.parameters.thicknessMm}mm`],
        ['Blank', formatBlank(q.analysis)],
        ['Cut Length', `${(q.analysis.cutLengthMm / 1000).toFixed(2)}m`],
        ['Pierces', `${q.analysis.pierces}`],
        ...(q.breakdown.bendCount > 0 ? ([['Bends', `${q.breakdown.bendCount}`]] as const) : []),
      ]
      : [
        ['Thickness', `${q.parameters.thicknessMm}mm`],
        ['Cut Length', `${(q.geometry.cutLengthMm / 1000).toFixed(2)}m`],
        ['Pierces', `${q.geometry.holeCount}`],
      ];
  return [
    ['Material', getMaterialName(materialId)],
    ...processRows,
    ['Finish', getFinishRate(finishType)?.label ?? 'None'],
    ['Quantity', `${quantity} pcs`],
    ['Turnaround', getTurnaroundOption(turnaround)?.label ?? turnaround],
  ];
}

/* ── Shared presentation ───────────────────────────────────────────────────── */

type Row = readonly [string, string];

/** One cost card in the transparency breakdown: what it is, what it costs, how it was measured. */
function CostCard({
  icon: Icon,
  label,
  cost,
  title,
  rows,
  subRows,
  note,
}: {
  icon: typeof Lightning;
  label: string;
  cost?: string;
  title: string;
  rows: ReadonlyArray<Row>;
  subRows?: ReadonlyArray<Row>;
  note: string;
}) {
  return (
    <article className="flex flex-col justify-between gap-6 rounded-2xl border border-lp-border bg-lp-bg p-6">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="lp-mono flex items-center gap-2 text-lp-muted-fg">
            <Icon aria-hidden="true" className="size-4 text-lp-primary" weight="bold" />
            {label}
          </span>
          {cost && (
            <span className="title-4 lp-num">
              {cost}
              <span className="caption-5 text-lp-muted-fg"> /unit</span>
            </span>
          )}
        </div>
        <h4 className="title-3 mt-4">{title}</h4>
        <dl className="mt-4 space-y-2">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="caption-2 text-lp-muted-fg">{k}</dt>
              <dd className="caption-1 lp-num text-right">{v}</dd>
            </div>
          ))}
        </dl>
        {subRows && subRows.length > 0 && (
          <dl className="mt-4 space-y-1 border-t border-lp-border pt-4">
            {subRows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="caption-5 text-lp-muted-fg">{k}</dt>
                <dd className="caption-4 lp-num text-right">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <p className="caption-5 rounded-xl bg-lp-muted px-3 py-2 text-lp-muted-fg">{note}</p>
    </article>
  );
}

function TransparencyShell({
  icon: Icon,
  title,
  lead,
  children,
}: {
  icon: typeof Lightning;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby="transparency-heading" className="rounded-3xl border border-lp-border bg-lp-card p-6 md:p-8">
      <div className="flex flex-col justify-between gap-4 border-b border-lp-border pb-6 md:flex-row md:items-end">
        <div>
          <p className="lp-mono flex items-center gap-2 text-lp-primary">
            <Icon aria-hidden="true" className="size-4" weight="bold" />
            Cost and time transparency
          </p>
          <h3 id="transparency-heading" className="heading-5 mt-2">
            {title}
          </h3>
          <p className="body-6 mt-1 max-w-[640px] text-lp-muted-fg">{lead}</p>
        </div>
        <span className="lp-mono flex shrink-0 items-center gap-2 rounded-full bg-lp-primary/10 px-3 py-1 text-lp-primary">
          <CheckCircle aria-hidden="true" className="size-4" weight="fill" />
          Every line shown
        </span>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function ManufacturingTransparencySection({
  quote,
  quantity,
}: {
  quote: AnyQuoteResult;
  quantity: number;
}) {
  if (isCncQuote(quote)) {
    const analysis = quote.analysis;
    const stock = analysis.stock;
    const setups = analysis.setups;
    const material = getMaterialById(quote.parameters.materialId);
    const cncData = getCncMaterialData(quote.parameters.materialId);
    const density = material?.densityGCm3 ?? 2.7;
    const stockVolCm3 = (stock?.volumeMm3 ?? 0) / 1000;
    const partVolCm3 = analysis.part.volumeMm3 / 1000;
    const stockMassKg = (stockVolCm3 * density) / 1000;
    const partMassKg = (partVolCm3 * density) / 1000;
    const scrapMassKg = Math.max(0, stockMassKg - partMassKg);
    const stockPrice =
      stock?.shape === 'round_bar'
        ? (cncData?.barPricePerKg ?? 360)
        : (cncData?.blockPricePerKg ?? 380);

    const process = quote.process;
    const machineHourlyRate = DEFAULT_CNC_SHOP_RATES.machineRatePerHour[process] ?? 1000;
    const setupHourlyRate = DEFAULT_CNC_SHOP_RATES.setupRatePerHour;
    const machinabilityGroup = cncData?.machinabilityGroup ?? 'aluminium';
    const times = analysis.machiningTime[machinabilityGroup];

    const totalBatchCycleMin = quote.breakdown.cycleTimeMin * quantity;
    const totalSetupCostBatch = quote.breakdown.setupCost * quantity;
    const totalProgCostBatch = quote.breakdown.programmingCost * quantity;

    return (
      <TransparencyShell
        icon={Gear}
        title="Cost and time breakdown"
        lead="Calculated from simulated cutter paths, material removal rates and fixturing setups read from your CAD geometry."
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <CostCard
            icon={Cube}
            label="Raw material"
            cost={formatInr(quote.breakdown.materialCost)}
            title={material?.name ?? quote.parameters.materialId}
            rows={[
              ['Stock size', formatCncStock(stock)],
              ['Raw stock mass', stockMassKg > 0 ? `${stockMassKg.toFixed(2)} kg` : '—'],
              ['Part net mass', partMassKg > 0 ? `${partMassKg.toFixed(2)} kg` : '—'],
              ['Removed chips', `${scrapMassKg > 0 ? `${scrapMassKg.toFixed(2)} kg` : '—'} (${((stock?.removalRatio ?? 0) * 100).toFixed(0)}%)`],
              ['Material rate', `₹${stockPrice} / kg`],
            ]}
            note="Sized from the standard plate and bar catalogue with face off allowances."
          />
          <CostCard
            icon={Gear}
            label="Machining"
            cost={formatInr(quote.breakdown.machiningCost)}
            title={CNC_PROCESS_LABELS[process]}
            rows={[
              ['Cycle time per part', formatDuration(quote.breakdown.cycleTimeMin)],
              ...(quantity > 1 ? ([['Total batch machining', formatDuration(totalBatchCycleMin)]] as const) : []),
              ['Machine hour rate', `₹${machineHourlyRate.toLocaleString('en-IN')} / hr`],
            ]}
            subRows={
              times
                ? [
                    ['Roughing', formatDuration(times.roughingMin)],
                    ['Surface finishing', formatDuration(times.finishingMin)],
                    [`Hole drilling (${analysis.features.holeCount} holes)`, formatDuration(times.drillingMin)],
                    ...((quote.breakdown.tappingCost ?? 0) > 0
                      ? ([[`Tapping (${quote.breakdown.tappedHoles} holes)`, formatInr(quote.breakdown.tappingCost ?? 0)]] as const)
                      : []),
                    ['Tool changes and rapids', formatDuration(times.toolChangeMin + times.overheadMin)],
                  ]
                : undefined
            }
            note="Machining rates include spindle power, tool wear and the operator."
          />
          <CostCard
            icon={Wrench}
            label="Setup and fixturing"
            cost={formatInr(quote.breakdown.setupCost + quote.breakdown.programmingCost)}
            title={`${setups.count} vise flip${setups.count > 1 ? 's' : ''} (${setups.directions.join(', ')})`}
            rows={[
              ['Setups', `${setups.count} fixturing${setups.count > 1 ? 's' : ''}`],
              ['Setup time', formatDuration(analysis.setupTimeMin)],
              ['Setup hour rate', `₹${setupHourlyRate} / hr`],
              ['Tools', `${analysis.toolCount} cutters`],
              ['CAM programming', formatDuration(analysis.programmingTimeMin)],
              ['Shared across', `${quantity} unit${quantity > 1 ? 's' : ''}`],
            ]}
            note="Fixed costs are shared across the batch, so larger orders lower the setup cost per part."
          />
        </div>

        <p className="body-6 mt-4 flex items-start gap-3 rounded-2xl bg-lp-primary/5 p-4">
          <Lightning aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-lp-primary" weight="fill" />
          <span>
            <span className="body-4">Batch economy:</span> setup ({formatDuration(analysis.setupTimeMin)}) and CAM programming (
            {formatDuration(analysis.programmingTimeMin)}) are one time costs of{' '}
            <span className="body-4 lp-num">{formatInr(totalSetupCostBatch + totalProgCostBatch)}</span>, shared across all{' '}
            {quantity} parts ({formatInr(quote.breakdown.setupCost + quote.breakdown.programmingCost)} per unit).
          </span>
        </p>
      </TransparencyShell>
    );
  }

  if (isSheetQuoteResult(quote)) {
    const { analysis, breakdown } = quote;
    const sheetMaterial = getSheetMaterial(quote.parameters.materialId);
    const laser =
      sheetMaterial && ['mild_steel', 'stainless', 'aluminium'].includes(sheetMaterial.family)
        ? 'Fiber laser (3 kW)'
        : 'CO₂ laser';

    return (
      <TransparencyShell
        icon={Lightning}
        title="Laser cutting cost and time breakdown"
        lead={`Measured from your ${analysis.profileOnly ? 'flat profile' : '3D model'}: blank size, total cut perimeter, pierces${analysis.profileOnly ? '' : ' and bends'}, priced with our laser speed cards.`}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <CostCard
            icon={Cube}
            label="Sheet material"
            title={`${sheetMaterial?.name ?? 'Sheet'} (${quote.parameters.thicknessMm} mm)`}
            rows={[
              ['Blank', formatBlank(analysis)],
              ['Sheet used', `${Math.round(breakdown.sheetUtilisation * 100)}% of bought sheet`],
              ['Material cost', `${formatInr(breakdown.materialCost)} / unit`],
            ]}
            note="Nesting efficiency improves as the batch grows."
          />
          <CostCard
            icon={Lightning}
            label="Laser cutting"
            title={laser}
            rows={[
              ['Cut perimeter', `${(analysis.cutLengthMm / 1000).toFixed(2)} m`],
              ['Pierces', `${analysis.pierces}`],
              ['Cut time', `${formatDuration(breakdown.cutTimeMin)} / unit`],
              ['Cutting cost', `${formatInr(breakdown.cutCost)} / unit`],
            ]}
            note="Measured from your file: the outer profile plus every internal cut out."
          />
          <CostCard
            icon={Wrench}
            label="Setup and forming"
            title={breakdown.bendCount > 0 ? `${breakdown.bendCount} bend${breakdown.bendCount > 1 ? 's' : ''} on the press brake` : 'Flat part, no bending'}
            rows={[
              ['Nesting and setup', `${formatInr(breakdown.laserSetupCost)} / unit`],
              ...(breakdown.bendCount > 0 ? ([['Bending', `${formatInr(breakdown.bendingCost)} / unit`]] as const) : []),
              ['Surface finish', `${formatInr(breakdown.finishCost)} / unit`],
            ]}
            note={`Setup is a one time job cost shared across ${quantity} unit${quantity > 1 ? 's' : ''}.`}
          />
        </div>
      </TransparencyShell>
    );
  }

  // Legacy laser quotes (saved before laser pricing read the real file)
  const geometry = quote.geometry;
  const material = getMaterialById(quote.parameters.materialId);
  const cutLengthM = (geometry.cutLengthMm / 1000).toFixed(2);
  const thicknessMm = quote.parameters.thicknessMm;

  return (
    <TransparencyShell
      icon={Lightning}
      title="Laser cutting cost and time breakdown"
      lead="Derived from your contour geometry, total cut perimeter, pierces and laser speed cards."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <CostCard
          icon={Cube}
          label="Sheet material"
          title={`${material?.name ?? 'Sheet metal'} (${thicknessMm} mm)`}
          rows={[
            ['Bounding box', `${geometry.boundingBox.widthMm.toFixed(1)} × ${geometry.boundingBox.heightMm.toFixed(1)} mm`],
            ['Material cost', `${formatInr(quote.breakdown.materialCost)} / unit`],
          ]}
          note="Nesting efficiency improves as the batch grows."
        />
        <CostCard
          icon={Lightning}
          label="Laser cutting"
          title="Fiber laser"
          rows={[
            ['Cut perimeter', `${cutLengthM} m`],
            ['Pierces and internal holes', `${geometry.holeCount} pierces`],
            ['Cutting cost', `${formatInr(quote.breakdown.cutCost)} / unit`],
          ]}
          note="The machine rate covers assist gas, optics and electricity."
        />
        <CostCard
          icon={Wrench}
          label="Job setup"
          title="Batch loading"
          rows={[
            ['Setup and nesting', `${formatInr(quote.breakdown.setupCost)} / unit`],
            ['Batch quantity', `${quantity} unit${quantity > 1 ? 's' : ''}`],
            ['Surface finish', `${formatInr(quote.breakdown.finishCost)} / unit`],
          ]}
          note="The sheet setup fee is shared across the whole quantity."
        />
      </div>
    </TransparencyShell>
  );
}

/** Notice box: error (blocking), warning, or info. Inline and specific, never a toast. */
function Notice({
  tone,
  children,
  action,
}: {
  tone: 'error' | 'warning' | 'info';
  children: ReactNode;
  action?: ReactNode;
}) {
  const Icon = tone === 'error' ? WarningCircle : tone === 'warning' ? Warning : Info;
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col items-start justify-between gap-3 rounded-xl border p-4 sm:flex-row',
        tone === 'error' ? 'border-lp-destructive/40 bg-lp-destructive/5' : tone === 'warning' ? 'border-lp-fg/15 bg-lp-muted' : 'border-lp-primary/20 bg-lp-primary/5'
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          aria-hidden="true"
          className={cn('mt-0.5 size-5 shrink-0', tone === 'error' ? 'text-lp-destructive' : tone === 'warning' ? 'text-lp-fg' : 'text-lp-primary')}
          weight="bold"
        />
        <div className={cn('body-6', tone === 'error' && 'text-lp-destructive')}>{children}</div>
      </div>
      {action}
    </div>
  );
}

/** Progress shimmer for analysis in flight (a skeleton, not a spinner). */
function Analysing({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="rounded-xl border border-lp-primary/20 bg-lp-primary/5 p-4">
      <p className="body-5 text-lp-primary">{children}</p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-lp-primary/10">
        <div className="lp-progress h-full w-1/3 rounded-full bg-lp-primary" />
      </div>
    </div>
  );
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="title-4 block">
      {children}
    </label>
  );
}

const selectClass = cn(fieldClass(), 'lp-select appearance-none pr-10');

export default function InstantQuotePage() {
  // useSearchParams needs a Suspense boundary for prerendering.
  return (
    <Suspense fallback={null}>
      <InstantQuoteContent />
    </Suspense>
  );
}

function InstantQuoteContent() {
  const { toast } = useToast();
  const router = useRouter();
  const shareRef = useSearchParams().get('ref');
  const [step, setStep] = useState<Step>(shareRef ? 'review' : 'upload');
  const [copied, setCopied] = useState(false);
  const [processMode, setProcessMode] = useState<QuoteProcessMode>('laser');
  const [showSidebarTimes, setShowSidebarTimes] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks own all state (rules.md)
  const fileUpload = useFileUpload();
  const activeFile = fileUpload.files.find((f) => f.id === fileUpload.activeFileId);
  const sheet = useSheetQuote(fileUpload.activeRawFile, activeFile?.sha256Hash ?? null, processMode);
  const cnc = useCncQuote(fileUpload.activeRawFile, activeFile?.sha256Hash ?? null, processMode);
  const cart = useQuoteCartContext();
  const saved = useSavedQuote(shareRef);

  // Instant CNC / laser pricing is for registered users. Middleware already sends
  // visitors without a session to /login; this covers stale sessions and 401s.
  const { user, isUserLoading } = useUser();
  const needsSignIn = (!isUserLoading && !user) || saved.needsSignIn;
  const returnTo = encodeURIComponent(
    shareRef ? `/quote/instant?ref=${shareRef}` : '/quote/instant'
  );
  const loginHref = `/login?tab=login&redirect=${returnTo}`;
  const registerHref = `/login?redirect=${returnTo}`;

  // Laser and CNC hooks share the config surface; pick the active one.
  const isCnc = processMode !== 'laser';
  const config = isCnc ? cnc : sheet;
  const activeQuote: AnyQuoteResult | null = isCnc ? cnc.quoteResult : sheet.quoteResult;
  const isCalculating = (isCnc ? cnc.analysisStatus : sheet.analysisStatus) === 'analyzing';

  const breakdownRows: ReadonlyArray<readonly [string, number]> = !activeQuote
    ? []
    : isCncQuote(activeQuote)
      ? [
        ['Material', activeQuote.breakdown.materialCost],
        ['Machining', activeQuote.breakdown.machiningCost],
        ['Setup', activeQuote.breakdown.setupCost],
        ...((activeQuote.breakdown.tappingCost ?? 0) > 0
          ? ([['Tapping', activeQuote.breakdown.tappingCost as number]] as const)
          : []),
        ['Finish', activeQuote.breakdown.finishCost],
      ]
      : [
        ['Material', activeQuote.breakdown.materialCost],
        ['Cutting', activeQuote.breakdown.cutCost],
        ['Setup', activeQuote.breakdown.laserSetupCost],
        ...(activeQuote.breakdown.bendingCost > 0
          ? ([['Bending', activeQuote.breakdown.bendingCost]] as const)
          : []),
        ['Finish', activeQuote.breakdown.finishCost],
      ];

  // Review shows the server's quote of record, never the client-side estimate.
  const reviewQuote = step === 'review' ? saved.quote : null;
  const isShared = saved.source === 'shared';
  const reviewFileName = isShared ? 'Shared quote' : (activeFile?.fileName ?? '');

  // Tick while on Review so the quote flips to expired without a reload.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (step !== 'review') return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [step]);
  const isExpired = reviewQuote !== null && reviewQuote.expiresAt <= now;
  const canOrder = reviewQuote !== null && !isExpired && !reviewQuote.hasBlockingIssues;

  const handleContinueToConfigure = (): void => {
    if (fileUpload.files.length > 0) {
      setStep('configure');
    }
  };

  // Persist through the matching route; the server re-prices and assigns the ref.
  const handleGetQuote = async (): Promise<void> => {
    if (!activeQuote || config.hasBlockingIssues || saved.status === 'saving') return;

    let input: SaveQuoteInput;
    let key: string;
    if (isCnc) {
      if (!cnc.analysisId) return;
      input = { kind: 'cnc', analysisId: cnc.analysisId, request: cnc.request };
      key = JSON.stringify(['cnc', cnc.analysisId, cnc.request]);
    } else {
      if (!sheet.analysisId) return;
      input = { kind: 'laser', analysisId: sheet.analysisId, request: sheet.request };
      key = JSON.stringify(['laser', sheet.analysisId, sheet.request]);
    }

    const result = await saved.save(key, input);
    if (result.success) {
      setStep('review');
    }
  };

  const handleCopyLink = (): void => {
    if (reviewQuote) {
      const url = `${window.location.origin}/quote/instant?ref=${reviewQuote.quoteRef}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddToCart = (): void => {
    if (reviewQuote && canOrder) {
      cart.addToCart(reviewQuote, reviewFileName);
      trackEvent('add_to_cart', { currency: 'INR', value: Math.round(reviewQuote.totalPrice) });
      toast({
        title: 'Part added to cart',
        description: `${reviewFileName} · ${reviewQuote.parameters.quantity} pcs · ₹${Math.round(reviewQuote.totalPrice).toLocaleString('en-IN')}`,
      });
    }
  };

  const handleProceedToCheckout = (): void => {
    if (reviewQuote && canOrder) {
      cart.addToCart(reviewQuote, reviewFileName);
      trackEvent('add_to_cart', { currency: 'INR', value: Math.round(reviewQuote.totalPrice) });
      router.push('/checkout');
    }
  };

  /** Leaves a shared link for a fresh quote (the shared file is not available here) */
  const handleStartNewQuote = (): void => {
    saved.clear();
    setStep('upload');
    router.replace('/quote/instant');
  };

  const stepIndex = step === 'upload' ? 0 : step === 'configure' ? 1 : 2;

  const steps = [
    { key: 'upload', label: 'Upload' },
    { key: 'configure', label: 'Configure' },
    { key: 'review', label: 'Review' },
  ] as const;
  const quoteDisabled = !activeQuote || config.hasBlockingIssues || isCalculating || saved.status === 'saving';

  return (
    <V2Shell noFooter>
      <div className="px-4 pb-16 pt-8 md:pb-24 md:pt-16">
        <div className="mx-auto max-w-[1200px]">
          {/* ── Header + stepper ── */}
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <Link
                href="/dashboard"
                className="caption-1 -ml-2 inline-flex items-center gap-2 rounded-full px-2 py-1 text-lp-muted-fg transition-colors duration-300 ease-lp hover:bg-lp-muted hover:text-lp-fg"
              >
                <CaretLeft aria-hidden="true" className="size-4" weight="bold" />
                Back to dashboard
              </Link>
              <div className="mt-4">
                <Tag>Instant quote</Tag>
              </div>
              <h1 className="heading-2 mt-4">
                Get a price in <Accent>seconds</Accent>
              </h1>
              <p className="body-3 mt-2 text-lp-muted-fg">Upload a STEP file, pick your options and see the full price before you order.</p>
            </div>

            <ol className="flex items-center gap-2" aria-label="Quote progress">
              {steps.map((s, i) => {
                const done = i < stepIndex;
                const current = i === stepIndex;
                return (
                  <li key={s.key} className="flex items-center gap-2" aria-current={current ? 'step' : undefined}>
                    <span
                      className={cn(
                        'lp-mono flex size-8 items-center justify-center rounded-full border transition-colors duration-500 ease-lp',
                        current
                          ? 'border-lp-primary bg-lp-primary text-lp-primary-fg'
                          : done
                            ? 'border-lp-primary bg-lp-primary/10 text-lp-primary'
                            : 'border-lp-border text-lp-muted-fg'
                      )}
                    >
                      {done ? <Check aria-hidden="true" className="size-4" weight="bold" /> : i + 1}
                    </span>
                    <span className={cn('caption-1', current ? 'text-lp-fg' : 'text-lp-muted-fg')}>{s.label}</span>
                    {i < steps.length - 1 && <span aria-hidden="true" className="h-px w-6 bg-lp-border md:w-12" />}
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="mt-12">
            {/* ═══ SIGN-IN REQUIRED ═══ */}
            {needsSignIn && (
              <div className="lp-hero-in mx-auto max-w-[520px] rounded-3xl border border-lp-border bg-lp-card p-6 text-center md:p-12">
                <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-lp-primary/10 text-lp-primary">
                  <SignIn aria-hidden="true" className="size-8" weight="duotone" />
                </span>
                <h2 className="heading-5 mt-6">Sign in for instant pricing</h2>
                <p className="body-6 mt-2 text-lp-muted-fg">
                  CNC machining and laser cutting quotes are available to registered MechHub users.
                  {shareRef ? ` Sign in to view quote ${shareRef}.` : ''}
                </p>
                <div className="mt-8 flex flex-col justify-center gap-2 sm:flex-row">
                  <Link href={loginHref} className={buttonClass('primary')}>
                    Sign in
                  </Link>
                  <Link href={registerHref} className={buttonClass('secondary')}>
                    Create an account
                  </Link>
                </div>
              </div>
            )}

            {/* ═══ STEP 1: UPLOAD ═══ */}
            {!needsSignIn && step === 'upload' && (
              <div className="lp-hero-in grid gap-8 lg:grid-cols-[1.5fr_1fr]">
                <div className="space-y-4">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Upload STEP files"
                    className={cn(
                      'lp-blueprint group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl p-8 text-center text-lp-primary-fg transition-transform duration-500 ease-lp md:p-16',
                      fileUpload.isDragging && 'scale-[1.01]'
                    )}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      fileUpload.setDragging(true);
                    }}
                    onDragLeave={() => fileUpload.setDragging(false)}
                    onDrop={fileUpload.handleFileDrop}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'pointer-events-none absolute inset-4 rounded-2xl border border-dashed transition-colors duration-300 ease-lp',
                        fileUpload.isDragging ? 'border-lp-primary-fg' : 'border-lp-primary-fg/30 group-hover:border-lp-primary-fg/60'
                      )}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept={fileUpload.acceptedFormats}
                      multiple
                      onChange={fileUpload.handleFileSelect}
                    />
                    <span className="flex size-16 items-center justify-center rounded-2xl bg-lp-bg text-lp-primary transition-transform duration-500 ease-lp group-hover:-translate-y-1">
                      <UploadSimple aria-hidden="true" className="size-8" weight="bold" />
                    </span>
                    <h2 className="heading-5 mt-6">
                      {fileUpload.isDragging ? 'Drop to upload' : fileUpload.files.length > 0 ? 'Add more files' : 'Drop your STEP file here'}
                    </h2>
                    <p className="body-6 mt-2 text-lp-primary-fg/80">or click to browse your computer</p>
                    <span className="lp-mono mt-6 rounded-full border border-lp-primary-fg/30 px-3 py-1">.STEP / .STP</span>
                  </div>

                  {/* File list */}
                  {fileUpload.files.length > 0 && (
                    <div>
                      <p className="lp-mono flex items-center gap-2 text-lp-muted-fg">
                        <Stack aria-hidden="true" className="size-4 text-lp-primary" weight="bold" />
                        {fileUpload.files.length} {fileUpload.files.length === 1 ? 'file' : 'files'} uploaded
                      </p>
                      <ul className="mt-2 space-y-2">
                        {fileUpload.files.map((f) => {
                          const active = f.id === fileUpload.activeFileId;
                          return (
                            <li key={f.id}>
                              <div
                                className={cn(
                                  'group flex items-center gap-4 rounded-2xl border bg-lp-bg px-4 py-3 transition-colors duration-300 ease-lp',
                                  active ? 'border-lp-primary' : 'border-lp-border hover:border-lp-primary/40'
                                )}
                              >
                                <button
                                  type="button"
                                  onClick={() => fileUpload.setActiveFile(f.id)}
                                  aria-pressed={active}
                                  className="flex min-w-0 flex-1 items-center gap-4 rounded-xl text-left"
                                >
                                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lp-primary/10 text-lp-primary">
                                    <FileCode aria-hidden="true" className="size-5" weight="duotone" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="title-4 block truncate">{f.fileName}</span>
                                    <span className="caption-5 lp-num text-lp-muted-fg">
                                      {(f.fileSizeBytes / 1024).toFixed(0)} KB ·{' '}
                                      {f.fileName.toLowerCase().endsWith('.dxf') ? '2D profile' : '3D model'}
                                    </span>
                                  </span>
                                </button>
                                {f.status === 'ready' && <CheckCircle aria-label="Ready" className="size-5 shrink-0 text-lp-primary" weight="fill" />}
                                {f.status === 'uploading' && (
                                  <span className="lp-mono flex shrink-0 items-center gap-2 text-lp-primary" role="status">
                                    <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-lp-primary" />
                                    Uploading
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => fileUpload.removeFile(f.id)}
                                  aria-label={`Remove ${f.fileName}`}
                                  className="lp-press flex size-8 shrink-0 items-center justify-center rounded-full text-lp-muted-fg hover:bg-lp-destructive/10 hover:text-lp-destructive"
                                >
                                  <Trash aria-hidden="true" className="size-4" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleContinueToConfigure}
                    disabled={fileUpload.files.length === 0}
                    className={cn(buttonClass('primary', 'md', true), 'w-full justify-between disabled:cursor-not-allowed disabled:opacity-50')}
                  >
                    Configure your part
                    <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-lp-primary-fg/15">
                      <ArrowRight className="size-4" weight="bold" />
                    </span>
                  </button>
                </div>

                <aside aria-label="How instant quoting works" className="rounded-3xl border border-lp-border bg-lp-card p-6 md:p-8">
                  <h2 className="heading-6">What happens next</h2>
                  <ol className="mt-6 space-y-4">
                    {[
                      { icon: Cube, title: 'We measure your part', body: 'Size, cut length, holes, bends and setups are read straight from the model.' },
                      { icon: Gear, title: 'You choose the options', body: 'Process, material, finish, quantity and turnaround. The price updates live.' },
                      { icon: CheckCircle, title: 'You lock the price', body: 'Save the quote, share it with your team, or check out.' },
                    ].map(({ icon: Icon, title, body }, i) => (
                      <li key={title} className="flex gap-4">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lp-bg text-lp-primary">
                          <Icon aria-hidden="true" className="size-5" weight="duotone" />
                        </span>
                        <span>
                          <span className="lp-mono text-lp-muted-fg">Step 0{i + 1}</span>
                          <span className="title-4 mt-1 block">{title}</span>
                          <span className="caption-2 text-lp-muted-fg">{body}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <ul className="mt-8 space-y-2 border-t border-lp-border pt-6">
                    {[
                      { icon: LockKey, label: 'Every file is covered by our NDA' },
                      { icon: Lightning, label: 'Laser cutting, CNC milling and turning' },
                    ].map(({ icon: Icon, label }) => (
                      <li key={label} className="caption-1 flex items-center gap-2 text-lp-muted-fg">
                        <Icon aria-hidden="true" className="size-4 text-lp-primary" weight="bold" />
                        {label}
                      </li>
                    ))}
                  </ul>
                </aside>
              </div>
            )}

            {/* ═══ STEP 2: CONFIGURE ═══ */}
            {!needsSignIn && step === 'configure' && (
              <div className="lp-hero-in">
                {/* Active file */}
                {activeFile && (
                  <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-lp-border bg-lp-bg p-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lp-primary/10 text-lp-primary">
                        <FileCode aria-hidden="true" className="size-5" weight="duotone" />
                      </span>
                      <div className="min-w-0">
                        <p className="title-4 truncate">{activeFile.fileName}</p>
                        <p className="caption-5 lp-num text-lp-muted-fg">
                          {isCnc
                            ? cnc.analysis
                              ? `${cnc.analysis.part.boundingBox.x} × ${cnc.analysis.part.boundingBox.y} × ${cnc.analysis.part.boundingBox.z} mm · ${cnc.analysis.features.holeCount} holes`
                              : cnc.analysisStatus === 'analyzing'
                                ? 'Analysing…'
                                : '—'
                            : sheet.analysis
                              ? `${formatBlank(sheet.analysis)} · ${sheet.analysis.holes.reduce((n, h) => n + h.count, 0)} holes`
                              : sheet.analysisStatus === 'analyzing'
                                ? 'Analysing…'
                                : '—'}
                        </p>
                      </div>
                    </div>
                    <button type="button" onClick={() => setStep('upload')} className={buttonClass('secondary', 'sm')}>
                      Change file
                    </button>
                  </div>
                )}

                <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
                  {/* Left: configuration */}
                  <div className="space-y-8 rounded-3xl border border-lp-border bg-lp-bg p-6 md:p-8">
                    {/* Process */}
                    <fieldset>
                      <legend className="title-4">Process</legend>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3">
                        {PROCESS_OPTIONS.map(({ mode, label, hint, Icon }) => {
                          const on = processMode === mode;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setProcessMode(mode)}
                              aria-pressed={on}
                              className={cn(
                                'lp-press flex items-center gap-3 rounded-2xl border p-4 text-left',
                                on ? 'border-lp-primary bg-lp-primary text-lp-primary-fg' : 'border-lp-border hover:border-lp-primary/40 hover:bg-lp-card'
                              )}
                            >
                              <Icon aria-hidden="true" className="size-5 shrink-0" weight={on ? 'fill' : 'regular'} />
                              <span>
                                <span className="title-4 block">{label}</span>
                                <span className={cn('caption-5', on ? 'text-lp-primary-fg/80' : 'text-lp-muted-fg')}>{hint}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>

                    {/* CNC part analysis */}
                    {isCnc && (
                      <div className="space-y-2">
                        {cnc.analysisStatus === 'analyzing' && <Analysing>Analysing part geometry: stock, setups and machining time…</Analysing>}
                        {cnc.analysisStatus === 'unsupported_file' && (
                          <Notice tone="warning">CNC quotes need a STEP file (.step or .stp). Upload the 3D model of this part to price it for machining.</Notice>
                        )}
                        {cnc.analysisStatus === 'error' && (
                          <Notice
                            tone="error"
                            action={
                              <button type="button" onClick={cnc.retryAnalysis} className={cn(buttonClass('secondary', 'sm'), 'shrink-0')}>
                                <ArrowsClockwise aria-hidden="true" className="size-4" /> Retry
                              </button>
                            }
                          >
                            {cnc.error}
                          </Notice>
                        )}
                        {cnc.analysis && (
                          <>
                            {cnc.processMismatch && (
                              <Notice tone="info">
                                This part is best made by {CNC_PROCESS_LABELS[cnc.analysis.process.recommended]}, so it is priced for that process.
                              </Notice>
                            )}
                            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {[
                                ['Recommended', CNC_PROCESS_LABELS[cnc.analysis.process.recommended]],
                                ['Stock', formatCncStock(cnc.analysis.stock)],
                                [
                                  'Setups',
                                  `${cnc.analysis.setups.count}${cnc.analysis.setups.directions.length > 0 ? ` (${cnc.analysis.setups.directions.join(', ')})` : ''}`,
                                ],
                                ['Cycle time', cnc.quoteResult ? `${cnc.quoteResult.breakdown.cycleTimeMin.toFixed(1)} min/part` : '—'],
                              ].map(([lbl, val]) => (
                                <div key={lbl} className="rounded-xl bg-lp-card p-3">
                                  <dt className="lp-mono text-lp-muted-fg">{lbl}</dt>
                                  <dd className="caption-1 lp-num mt-1">{val}</dd>
                                </div>
                              ))}
                            </dl>
                          </>
                        )}
                      </div>
                    )}

                    {/* Laser part analysis — the converter measures the real file */}
                    {!isCnc && (
                      <div className="space-y-2">
                        {sheet.analysisStatus === 'analyzing' && <Analysing>Measuring your part: flat blank, cut length, pierces and bends…</Analysing>}
                        {sheet.analysisStatus === 'unsupported_file' && (
                          <Notice tone="warning">Laser quotes need a STEP file (.step or .stp). Upload the part&apos;s 3D model to price it.</Notice>
                        )}
                        {sheet.analysisStatus === 'error' && sheet.errorCode === ErrorCode.NOT_SHEET_METAL && (
                          <Notice
                            tone="warning"
                            action={
                              <button type="button" onClick={() => setProcessMode('cnc_milling')} className={cn(buttonClass('secondary', 'sm'), 'shrink-0')}>
                                <Gear aria-hidden="true" className="size-4" /> Price as CNC
                              </button>
                            }
                          >
                            {sheet.error} Laser cutting needs a part cut from one flat sheet of constant thickness. Solid parts are priced by CNC machining.
                          </Notice>
                        )}
                        {sheet.analysisStatus === 'error' && sheet.errorCode !== ErrorCode.NOT_SHEET_METAL && (
                          <Notice
                            tone="error"
                            action={
                              <button type="button" onClick={sheet.retryAnalysis} className={cn(buttonClass('secondary', 'sm'), 'shrink-0')}>
                                <ArrowsClockwise aria-hidden="true" className="size-4" /> Retry
                              </button>
                            }
                          >
                            {sheet.error}
                          </Notice>
                        )}
                        {sheet.analysis && (
                          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {[
                              ['Blank', formatBlank(sheet.analysis)],
                              ['Cut length', `${(sheet.analysis.cutLengthMm / 1000).toFixed(2)} m`],
                              ['Pierces', `${sheet.analysis.pierces}`],
                              sheet.analysis.profileOnly
                                ? ['Thickness', 'Pick below']
                                : ['Model', `${sheet.analysis.thicknessMm} mm · ${sheet.analysis.bends.length} bend${sheet.analysis.bends.length === 1 ? '' : 's'}`],
                            ].map(([lbl, val]) => (
                              <div key={lbl} className="rounded-xl bg-lp-card p-3">
                                <dt className="lp-mono text-lp-muted-fg">{lbl}</dt>
                                <dd className="caption-1 lp-num mt-1">{val}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                    )}

                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Material */}
                      <div className="space-y-2">
                        <FieldLabel htmlFor="iq-material">Material</FieldLabel>
                        <select id="iq-material" value={config.state.materialId} onChange={(e) => config.setMaterialId(e.target.value)} className={selectClass}>
                          {config.materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.alloy})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Thickness — sheet parts only */}
                      {!isCnc && (
                        <div className="space-y-2">
                          <FieldLabel htmlFor="iq-thickness">Thickness</FieldLabel>
                          <select id="iq-thickness" value={sheet.state.thicknessMm} onChange={(e) => sheet.setThicknessMm(Number(e.target.value))} className={selectClass}>
                            {sheet.availableThicknesses.map((t) => (
                              <option key={t} value={t}>
                                {t} mm
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Finish */}
                      <div className="space-y-2">
                        <FieldLabel htmlFor="iq-finish">Surface finish</FieldLabel>
                        <select id="iq-finish" value={config.state.finishType} onChange={(e) => config.setFinishType(e.target.value as never)} className={selectClass}>
                          {config.availableFinishes.map((f) => (
                            <option key={f.type} value={f.type}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="space-y-2">
                        <FieldLabel htmlFor="iq-qty">Quantity</FieldLabel>
                        <div className="relative">
                          <input
                            id="iq-qty"
                            type="number"
                            min={1}
                            max={10000}
                            inputMode="numeric"
                            value={config.state.quantity}
                            onChange={(e) => config.setQuantity(Number(e.target.value))}
                            className={cn(fieldClass(), 'lp-num')}
                          />
                          {config.savingsPercent > 0 && (
                            <span className="lp-mono absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-lp-primary/10 px-2 py-0.5 text-lp-primary">
                              {config.savingsPercent}% off
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Turnaround */}
                      <fieldset className="md:col-span-2">
                        <legend className="title-4">Turnaround</legend>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                          {config.turnaroundOptions.map((opt) => {
                            const on = config.state.turnaround === opt.type;
                            return (
                              <button
                                key={opt.type}
                                type="button"
                                onClick={() => config.setTurnaround(opt.type)}
                                aria-pressed={on}
                                className={cn(
                                  'lp-press rounded-xl border px-3 py-2 text-center',
                                  on ? 'border-lp-primary bg-lp-primary text-lp-primary-fg' : 'border-lp-border hover:border-lp-primary/40 hover:bg-lp-card'
                                )}
                              >
                                <span className="title-4 block">{opt.days === 0 ? 'Same day' : `${opt.days} days`}</span>
                                <span className={cn('lp-mono block', on ? 'text-lp-primary-fg/80' : 'text-lp-muted-fg')}>
                                  {opt.multiplier === 1
                                    ? 'Base'
                                    : opt.multiplier < 1
                                      ? `−${Math.round((1 - opt.multiplier) * 100)}%`
                                      : `+${Math.round((opt.multiplier - 1) * 100)}%`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </fieldset>

                      {/* Threads — priced from the analysed holes */}
                      {isCnc && cnc.analysis && (
                        <div className="md:col-span-2">
                          <CncTappingPicker
                            holes={cnc.tappableHoles}
                            picks={cnc.tapPicks}
                            onPick={cnc.setTapPick}
                            tappingCost={cnc.quoteResult?.breakdown.tappingCost}
                            tappedHoles={cnc.quoteResult?.breakdown.tappedHoles}
                          />
                        </div>
                      )}
                    </div>

                    {/* DFM feedback */}
                    {config.dfmIssues.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="title-4 flex items-center gap-2">
                          <Warning aria-hidden="true" className="size-4" weight="bold" /> Design checks
                        </h3>
                        {config.dfmIssues.map((issue: DFMIssue, idx: number) => (
                          <Notice key={idx} tone={issue.blocking ? 'error' : 'warning'}>
                            <span className="body-5 block">{issue.message}</span>
                            <span className="caption-2 mt-1 block text-lp-muted-fg">Fix: {issue.fixSuggestion}</span>
                          </Notice>
                        ))}
                      </div>
                    )}

                    {/* Save failure — stay on Configure so the customer can retry */}
                    {saved.status === 'error' && !isShared && saved.error && (
                      <Notice tone="error">Your quote was not saved: {saved.error} Try again in a moment.</Notice>
                    )}

                    <div className="flex flex-col-reverse justify-between gap-2 border-t border-lp-border pt-6 sm:flex-row sm:items-center">
                      <button type="button" onClick={() => setStep('upload')} className={buttonClass('secondary')}>
                        <CaretLeft aria-hidden="true" className="size-4" weight="bold" /> Back
                      </button>
                      <button
                        type="button"
                        onClick={handleGetQuote}
                        disabled={quoteDisabled}
                        aria-busy={isCalculating || saved.status === 'saving'}
                        className={cn(buttonClass('primary', 'md', true), 'justify-between disabled:cursor-not-allowed disabled:opacity-50')}
                      >
                        {isCalculating ? 'Calculating price' : saved.status === 'saving' ? 'Saving your quote' : 'Review quote'}
                        <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-lp-primary-fg/15">
                          <ArrowRight className="size-4" weight="bold" />
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Right: live price */}
                  <div className="space-y-4 lg:sticky lg:top-24">
                    <section aria-labelledby="live-price" aria-live="polite" className="overflow-hidden rounded-3xl bg-lp-ink p-6 text-lp-ink-fg md:p-8">
                      <h2 id="live-price" className="lp-mono flex items-center gap-2 text-lp-ink-fg/60">
                        <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-lp-primary" />
                        Live price
                      </h2>

                      {isCalculating ? (
                        <div className="mt-6 space-y-4" aria-hidden="true">
                          <div className="h-10 w-40 animate-pulse rounded-lg bg-lp-ink-fg/10" />
                          <div className="h-12 animate-pulse rounded-xl bg-lp-ink-fg/10" />
                          <div className="space-y-2">
                            {[0, 1, 2, 3].map((i) => (
                              <div key={i} className="h-4 animate-pulse rounded bg-lp-ink-fg/10" />
                            ))}
                          </div>
                        </div>
                      ) : activeQuote ? (
                        <div className="mt-6 space-y-6">
                          <div>
                            <p className="heading-2 lp-num">₹{activeQuote.pricePerPart.toLocaleString('en-IN')}</p>
                            <p className="caption-2 mt-1 text-lp-ink-fg/60">{isCnc ? 'per part, estimate' : 'per part'}</p>
                          </div>

                          <div className="flex items-center justify-between rounded-xl bg-lp-ink-fg/5 px-4 py-3">
                            <span className="caption-1 text-lp-ink-fg/70">Total for {config.state.quantity} pcs</span>
                            <span className="title-2 lp-num">₹{activeQuote.totalPrice.toLocaleString('en-IN')}</span>
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="lp-mono text-lp-ink-fg/60">Cost breakdown</h3>
                              {isCncQuote(activeQuote) && (
                                <button
                                  type="button"
                                  onClick={() => setShowSidebarTimes((prev) => !prev)}
                                  aria-expanded={showSidebarTimes}
                                  className="caption-4 flex items-center gap-1 rounded text-lp-ink-fg/80 hover:text-lp-ink-fg"
                                >
                                  {showSidebarTimes ? 'Hide times' : 'Show times'}
                                  {showSidebarTimes ? <CaretUp aria-hidden="true" className="size-3" /> : <CaretDown aria-hidden="true" className="size-3" />}
                                </button>
                              )}
                            </div>
                            <dl className="mt-3 space-y-2">
                              {breakdownRows.map(([label, cost]) => (
                                <div key={label} className="flex justify-between">
                                  <dt className="caption-2 text-lp-ink-fg/70">{label}</dt>
                                  <dd className="caption-1 lp-num">{formatInr(cost)}</dd>
                                </div>
                              ))}
                            </dl>
                            {isCncQuote(activeQuote) && showSidebarTimes && (
                              <dl className="mt-3 space-y-2 rounded-xl bg-lp-ink-fg/5 p-3">
                                {[
                                  ['Machine time', `${formatDuration(activeQuote.breakdown.cycleTimeMin)} / unit`],
                                  [`Setups (${activeQuote.analysis.setups.count})`, `${formatDuration(activeQuote.analysis.setupTimeMin)} setup`],
                                  ['Stock', formatCncStock(activeQuote.analysis.stock)],
                                ].map(([k, v]) => (
                                  <div key={k} className="flex justify-between gap-4">
                                    <dt className="caption-5 text-lp-ink-fg/70">{k}</dt>
                                    <dd className="caption-4 lp-num truncate text-right">{v}</dd>
                                  </div>
                                ))}
                              </dl>
                            )}
                            <dl className="mt-3 space-y-2 border-t border-lp-ink-fg/10 pt-3">
                              <div className="flex justify-between">
                                <dt className="caption-2 text-lp-ink-fg/70">Quantity discount</dt>
                                <dd className="caption-1 lp-num text-lp-primary">−{config.savingsPercent}%</dd>
                              </div>
                              {activeQuote.breakdown.rushMultiplier !== 1 && (
                                <div className="flex justify-between">
                                  <dt className="caption-2 text-lp-ink-fg/70">Rush fee</dt>
                                  <dd className="caption-1 lp-num">+{Math.round((activeQuote.breakdown.rushMultiplier - 1) * 100)}%</dd>
                                </div>
                              )}
                            </dl>
                          </div>

                          <p className="caption-1 flex items-center gap-2 rounded-xl bg-lp-primary px-3 py-2">
                            <Clock aria-hidden="true" className="size-4" weight="bold" />
                            Ships in{' '}
                            {activeQuote.leadTimeDays === 0 ? 'same day' : `${activeQuote.leadTimeDays} day${activeQuote.leadTimeDays > 1 ? 's' : ''}`}
                          </p>

                          {isCnc && (
                            <p className="caption-5 text-lp-ink-fg/60">
                              Instant CNC prices are estimates from your part&apos;s geometry. Our engineers confirm the final price before machining starts.
                            </p>
                          )}
                        </div>
                      ) : config.error ? (
                        <p role="alert" className="body-6 mt-6 rounded-xl border border-lp-destructive/50 p-3 text-lp-ink-fg">
                          {config.error}
                        </p>
                      ) : (
                        <p className="body-6 mt-6 text-lp-ink-fg/60">Your price appears here as soon as the part is measured.</p>
                      )}
                    </section>

                    {/* Tier pricing */}
                    {config.tierPricing.length > 0 && (
                      <section aria-labelledby="tier-pricing" className="rounded-3xl border border-lp-border bg-lp-bg p-6">
                        <h2 id="tier-pricing" className="lp-mono text-lp-muted-fg">
                          Price per part by quantity
                        </h2>
                        <ul className="mt-4 space-y-1">
                          {config.tierPricing.slice(0, 6).map((tier: QuantityTier) => {
                            const on = tier.quantity === config.state.quantity;
                            return (
                              <li key={tier.quantity}>
                                <button
                                  type="button"
                                  onClick={() => config.setQuantity(tier.quantity)}
                                  aria-pressed={on}
                                  className={cn(
                                    'flex w-full items-center justify-between rounded-xl px-3 py-2 transition-colors duration-300 ease-lp',
                                    on ? 'bg-lp-primary text-lp-primary-fg' : 'hover:bg-lp-card'
                                  )}
                                >
                                  <span className="caption-1 lp-num">
                                    {tier.quantity} pc{tier.quantity > 1 ? 's' : ''}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <span className="caption-1 lp-num">₹{tier.pricePerPart.toLocaleString('en-IN')}</span>
                                    {tier.savingsPercent > 0 && (
                                      <span className={cn('lp-mono', on ? 'text-lp-primary-fg/80' : 'text-lp-primary')}>−{tier.savingsPercent}%</span>
                                    )}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ═══ STEP 3: REVIEW — shared link loading / not found ═══ */}
            {!needsSignIn && step === 'review' && !reviewQuote && isSharedLoadPending(shareRef, saved.status) && (
              <div className="mx-auto max-w-[520px] rounded-3xl border border-lp-border bg-lp-card p-6 text-center md:p-12">
                {saved.status === 'loading' ? (
                  <div role="status" className="space-y-4">
                    <div className="mx-auto h-8 w-48 animate-pulse rounded-lg bg-lp-muted" />
                    <div className="h-24 animate-pulse rounded-2xl bg-lp-muted" />
                    <p className="caption-1 text-lp-muted-fg">Loading quote {shareRef}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <WarningCircle aria-hidden="true" className="mx-auto size-8 text-lp-destructive" weight="duotone" />
                    <p role="alert" className="body-5">
                      {saved.error}
                    </p>
                    <div className="flex flex-col justify-center gap-2 sm:flex-row">
                      <button type="button" onClick={saved.retryShared} className={buttonClass('secondary')}>
                        <ArrowsClockwise aria-hidden="true" className="size-4" /> Try again
                      </button>
                      <button type="button" onClick={handleStartNewQuote} className={buttonClass('primary')}>
                        Start a new quote
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ═══ STEP 3: REVIEW ═══ */}
            {!needsSignIn && step === 'review' && reviewQuote && (
              <div className="lp-hero-in space-y-4">
                <section aria-labelledby="your-quote" className="overflow-hidden rounded-3xl border border-lp-border bg-lp-bg">
                  <div className="flex flex-col justify-between gap-4 border-b border-lp-border p-6 md:flex-row md:items-center md:p-8">
                    <div>
                      <h2 id="your-quote" className="heading-5">
                        Your quote
                      </h2>
                      <p className="caption-2 mt-1 text-lp-muted-fg">
                        {isCncQuote(reviewQuote) ? 'Estimate · ' : ''}
                        {isExpired ? `Expired at ${formatTime(reviewQuote.expiresAt)}` : `Valid until ${formatTime(reviewQuote.expiresAt)}`} ·{' '}
                        {reviewFileName}
                      </p>
                    </div>
                    <span className="lp-mono flex items-center gap-2 self-start rounded-full border border-lp-border px-3 py-2 md:self-auto">
                      <span className="text-lp-muted-fg">Ref</span>
                      <span className="text-lp-fg">{reviewQuote.quoteRef}</span>
                    </span>
                  </div>

                  <div className="grid md:grid-cols-[1fr_360px]">
                    <div className="flex flex-col justify-center p-6 md:p-8">
                      <p className="lp-mono text-lp-muted-fg">Total</p>
                      <p className="heading-1 lp-num mt-2">₹{reviewQuote.totalPrice.toLocaleString('en-IN')}</p>
                      <p className="caption-1 mt-4 flex items-center gap-2 text-lp-muted-fg">
                        <CheckCircle aria-hidden="true" className="size-4 text-lp-primary" weight="fill" />
                        {reviewQuote.parameters.quantity} parts at ₹{reviewQuote.pricePerPart.toLocaleString('en-IN')} each, excl. GST
                      </p>
                      <dl className="mt-8 grid grid-cols-3 gap-2">
                        {[
                          ['Per part', `₹${reviewQuote.pricePerPart.toLocaleString('en-IN')}`],
                          ['Quantity', `${reviewQuote.parameters.quantity}`],
                          ['Lead time', reviewQuote.leadTimeDays === 0 ? 'Same day' : `${reviewQuote.leadTimeDays} days`],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-xl bg-lp-card p-3">
                            <dt className="lp-mono text-lp-muted-fg">{k}</dt>
                            <dd className="title-3 lp-num mt-1">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>

                    <div className="border-t border-lp-border bg-lp-card p-6 md:border-l md:border-t-0 md:p-8">
                      <h3 className="lp-mono text-lp-primary">Specification</h3>
                      <dl className="mt-4 space-y-3">
                        {quoteSpecRows(reviewQuote).map(([lbl, val]) => (
                          <div key={lbl} className="flex items-start justify-between gap-4">
                            <dt className="caption-2 text-lp-muted-fg">{lbl}</dt>
                            <dd className="caption-1 lp-num text-right">{val}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </section>

                <ManufacturingTransparencySection quote={reviewQuote} quantity={reviewQuote.parameters.quantity} />

                {(isExpired || reviewQuote.hasBlockingIssues) && (
                  <Notice
                    tone={reviewQuote.hasBlockingIssues ? 'error' : 'warning'}
                    action={
                      isExpired && !isShared ? (
                        <button
                          type="button"
                          onClick={handleGetQuote}
                          disabled={saved.status === 'saving' || !activeQuote}
                          className={cn(buttonClass('secondary', 'sm'), 'shrink-0 disabled:opacity-50')}
                        >
                          <ArrowsClockwise aria-hidden="true" className="size-4" /> Refresh price
                        </button>
                      ) : undefined
                    }
                  >
                    {reviewQuote.hasBlockingIssues
                      ? 'This part has design problems that block manufacturing, so it cannot be ordered as quoted.'
                      : isShared
                        ? 'This quote has expired. Upload the part again to get a current price.'
                        : 'This quote has expired. Refresh it to lock a current price.'}
                  </Notice>
                )}

                {/* Actions */}
                <section aria-label="Order this part" className="lp-blueprint lp-marks flex flex-col justify-between gap-6 rounded-3xl p-6 text-lp-primary-fg md:p-8 xl:flex-row xl:items-center">
                  <div>
                    <p className="lp-mono opacity-80">Ready to order?</p>
                    <p className="heading-5 mt-2 max-w-[420px]">Check out to lock this price and start manufacturing.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={handleCopyLink} className={buttonClass('inverted-secondary')}>
                      {copied ? <Check aria-hidden="true" className="size-4" weight="bold" /> : <ShareNetwork aria-hidden="true" className="size-4" />}
                      {copied ? 'Link copied' : 'Share quote'}
                    </button>
                    <button type="button" onClick={isShared ? handleStartNewQuote : () => setStep('configure')} className={buttonClass('inverted-secondary')}>
                      {isShared ? 'New quote' : 'Edit options'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!canOrder}
                      className={cn(buttonClass('inverted-secondary'), 'disabled:cursor-not-allowed disabled:opacity-50')}
                    >
                      <ShoppingCartSimple aria-hidden="true" className="size-4" />
                      Add to cart ({cart.itemCount})
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      disabled={!canOrder}
                      className={cn(buttonClass('inverted', 'md', true), 'disabled:cursor-not-allowed disabled:opacity-50')}
                    >
                      Proceed to checkout
                      <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-lp-primary text-lp-primary-fg">
                        <ArrowRight className="size-4" weight="bold" />
                      </span>
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </V2Shell>
  );
}
