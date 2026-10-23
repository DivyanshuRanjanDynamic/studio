'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Loader2,
  Info,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Download,
  Trash2,
  Layers,
  Clock,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Cog,
  RotateCcw,
  RefreshCw,
  LogIn,
  Wrench,
  Boxes,
  Cpu,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { V2Shell } from '@/components/V2Shell';
import { useUser } from '@/firebase';
import { useFileUpload } from '@/hooks/use-file-upload';
import { useSheetQuote } from '@/hooks/use-sheet-quote';
import { useCncQuote } from '@/hooks/use-cnc-quote';
import { useQuoteCartContext } from '@/context/QuoteCartContext';
import { useToast } from '@/hooks/use-toast';
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

// ═══════════════════════════════════════════════════
// Instant Quote Page — File Upload → Configure → Review
// ═══════════════════════════════════════════════════

type Step = 'upload' | 'configure' | 'review';

const PROCESS_OPTIONS: ReadonlyArray<{
  mode: QuoteProcessMode;
  label: string;
  hint: string;
  Icon: typeof Zap;
}> = [
    { mode: 'laser', label: 'Laser Cutting', hint: 'Sheet parts · DXF / STEP', Icon: Zap },
    { mode: 'cnc_milling', label: 'CNC Milling', hint: 'Prismatic parts · STEP', Icon: Cog },
    { mode: 'cnc_turning', label: 'CNC Turning', hint: 'Round parts · STEP', Icon: RotateCcw },
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
    const programmingHourlyRate = DEFAULT_CNC_SHOP_RATES.programmingRatePerHour;
    const machinabilityGroup = cncData?.machinabilityGroup ?? 'aluminium';
    const times = analysis.machiningTime[machinabilityGroup];

    const totalBatchCycleMin = quote.breakdown.cycleTimeMin * quantity;
    const totalSetupCostBatch = quote.breakdown.setupCost * quantity;
    const totalProgCostBatch = quote.breakdown.programmingCost * quantity;

    return (
      <div className="bg-lp-card border border-lp-border rounded-sm p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lp-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-lp-primary lp-label-mono mb-1.5">
              <Cpu size={16} />
              <span>Manufacturing & Time Transparency</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-lp-fg tracking-tight">
              Cost & Time Breakup
            </h3>
            <p className="text-xs text-lp-muted-fg mt-1 max-w-2xl">
              Calculated using simulated cutter paths, physical material removal rates (MRR), and fixturing setups from your CAD geometry.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2 rounded-sm text-xs font-bold shrink-0">
            <CheckCircle size={15} />
            <span>Fair & Transparent Pricing</span>
          </div>
        </div>

        {/* 3 Main Transparent Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 1. Raw Material Card */}
          <div className="bg-lp-accent border border-lp-border rounded-sm p-6 flex flex-col justify-between space-y-4 hover:border-lp-primary/30 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 lp-label-mono text-lp-muted-fg">
                  <Boxes size={14} className="text-lp-primary" /> Raw Material
                </span>
                <span className="font-lp-mono text-sm font-bold text-lp-fg">
                  {formatInr(quote.breakdown.materialCost)}
                  <span className="text-[10px] font-normal text-lp-muted-fg"> /unit</span>
                </span>
              </div>
              <p className="text-xs font-bold text-lp-fg mb-4">
                {material?.name ?? quote.parameters.materialId}
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Stock Sizing</span>
                  <span className="font-semibold text-lp-fg text-right">
                    {formatCncStock(stock)}
                  </span>
                </div>
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Raw Stock Mass</span>
                  <span className="font-lp-mono font-semibold text-lp-fg">
                    {stockMassKg > 0 ? `${stockMassKg.toFixed(2)} kg` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Part Net Mass</span>
                  <span className="font-lp-mono font-semibold text-lp-fg">
                    {partMassKg > 0 ? `${partMassKg.toFixed(2)} kg` : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Removed Chips</span>
                  <span className="font-lp-mono font-semibold text-lp-fg">
                    {scrapMassKg > 0 ? `${scrapMassKg.toFixed(2)} kg` : '—'} ({((stock?.removalRatio ?? 0) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="flex justify-between text-lp-muted-fg border-t border-lp-border/60 pt-2">
                  <span>Material Rate</span>
                  <span className="font-lp-mono font-semibold text-lp-fg">
                    ₹{stockPrice} / kg
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-lp-muted-fg bg-lp-bg/70 p-2.5 rounded-sm border border-lp-border/50">
              Sized from standard plate/bar catalog with face-off allowances.
            </div>
          </div>

          {/* 2. Machining Operations Card */}
          <div className="bg-lp-accent border border-lp-border rounded-sm p-6 flex flex-col justify-between space-y-4 hover:border-lp-primary/30 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 lp-label-mono text-lp-muted-fg">
                  <Cog size={14} className="text-lp-primary" /> Machining Ops
                </span>
                <span className="font-lp-mono text-sm font-bold text-lp-fg">
                  {formatInr(quote.breakdown.machiningCost)}
                  <span className="text-[10px] font-normal text-lp-muted-fg"> /unit</span>
                </span>
              </div>
              <p className="text-xs font-bold text-lp-fg mb-4">
                {CNC_PROCESS_LABELS[process]}
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Cycle Time (Per Part)</span>
                  <span className="font-lp-mono font-bold text-lp-fg">
                    {formatDuration(quote.breakdown.cycleTimeMin)}
                  </span>
                </div>
                {quantity > 1 && (
                  <div className="flex justify-between text-lp-muted-fg">
                    <span>Total Batch Machining</span>
                    <span className="font-lp-mono font-semibold text-lp-fg">
                      {formatDuration(totalBatchCycleMin)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Machine Hour Rate</span>
                  <span className="font-lp-mono font-semibold text-lp-fg">
                    ₹{machineHourlyRate.toLocaleString('en-IN')} / hr
                  </span>
                </div>
                {times && (
                  <div className="border-t border-lp-border/60 pt-2 space-y-1.5 text-[11px] text-lp-muted-fg">
                    <div className="flex justify-between">
                      <span>• Roughing MRR</span>
                      <span className="font-lp-mono text-lp-fg">{formatDuration(times.roughingMin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Surface Finishing</span>
                      <span className="font-lp-mono text-lp-fg">{formatDuration(times.finishingMin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Hole Drilling ({analysis.features.holeCount} holes)</span>
                      <span className="font-lp-mono text-lp-fg">{formatDuration(times.drillingMin)}</span>
                    </div>
                    {(quote.breakdown.tappingCost ?? 0) > 0 && (
                      <div className="flex justify-between">
                        <span>• Tapping ({quote.breakdown.tappedHoles} holes)</span>
                        <span className="font-lp-mono text-lp-fg">{formatInr(quote.breakdown.tappingCost ?? 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>• Tool Swaps & Rapids</span>
                      <span className="font-lp-mono text-lp-fg">
                        {formatDuration(times.toolChangeMin + times.overheadMin)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-lp-muted-fg bg-lp-bg/70 p-2.5 rounded-sm border border-lp-border/50">
              Machining rates include spindle power, carbide tool wear & operator.
            </div>
          </div>

          {/* 3. Setup & Fixturing Card */}
          <div className="bg-lp-accent border border-lp-border rounded-sm p-6 flex flex-col justify-between space-y-4 hover:border-lp-primary/30 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-1.5 lp-label-mono text-lp-muted-fg">
                  <Wrench size={14} className="text-lp-primary" /> Setup & Fixturing
                </span>
                <span className="font-lp-mono text-sm font-bold text-lp-fg">
                  {formatInr(quote.breakdown.setupCost + quote.breakdown.programmingCost)}
                  <span className="text-[10px] font-normal text-lp-muted-fg"> /unit</span>
                </span>
              </div>
              <p className="text-xs font-bold text-lp-fg mb-4">
                {setups.count} Vise Flip{setups.count > 1 ? 's' : ''} ({setups.directions.join(', ')})
              </p>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Number of Setups</span>
                  <span className="font-lp-mono font-bold text-lp-fg">
                    {setups.count} fixturing{setups.count > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Setup Time</span>
                  <span className="font-lp-mono font-semibold text-lp-fg">
                    {formatDuration(analysis.setupTimeMin)}
                  </span>
                </div>
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Setup Hour Rate</span>
                  <span className="font-lp-mono font-semibold text-lp-fg">
                    ₹{setupHourlyRate} / hr
                  </span>
                </div>
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Tooling Count</span>
                  <span className="font-lp-mono font-semibold text-lp-fg">
                    {analysis.toolCount} cutters
                  </span>
                </div>
                <div className="flex justify-between text-lp-muted-fg border-t border-lp-border/60 pt-2">
                  <span>CAM Programming</span>
                  <span className="font-lp-mono font-semibold text-lp-fg">
                    {formatDuration(analysis.programmingTimeMin)}
                  </span>
                </div>
                <div className="flex justify-between text-lp-muted-fg">
                  <span>Amortized Across</span>
                  <span className="font-bold text-lp-primary">
                    {quantity} unit{quantity > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-[10px] text-lp-muted-fg bg-lp-bg/70 p-2.5 rounded-sm border border-lp-border/50">
              Fixed costs amortize across the batch — larger orders lower unit setup costs.
            </div>
          </div>
        </div>

        {/* Batch Economics Trust Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-sm bg-lp-accent/70 border border-lp-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-lp-primary text-white flex items-center justify-center shrink-0">
              <Zap size={16} />
            </div>
            <p className="text-xs text-lp-fg leading-relaxed">
              <strong className="text-lp-fg font-bold">Batch Economy:</strong> Total setup time (
              {formatDuration(analysis.setupTimeMin)}) and CAM programming ({formatDuration(analysis.programmingTimeMin)}) are fixed one-time investments of{' '}
              <strong>{formatInr(totalSetupCostBatch + totalProgCostBatch)}</strong>, shared across all{' '}
              <strong>{quantity} parts</strong> ({formatInr(quote.breakdown.setupCost + quote.breakdown.programmingCost)}/unit).
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isSheetQuoteResult(quote)) {
    const { analysis, breakdown } = quote;
    const sheetMaterial = getSheetMaterial(quote.parameters.materialId);
    const laser =
      sheetMaterial && ['mild_steel', 'stainless', 'aluminium'].includes(sheetMaterial.family)
        ? 'Fiber Laser (3 kW)'
        : 'CO₂ Laser';
    const cards: ReadonlyArray<{
      icon: React.ReactNode;
      label: string;
      title: string;
      rows: ReadonlyArray<readonly [string, string]>;
      note: string;
    }> = [
      {
        icon: <Boxes size={14} className="text-lp-primary" />,
        label: 'Sheet Material',
        title: `${sheetMaterial?.name ?? 'Sheet'} (${quote.parameters.thicknessMm} mm)`,
        rows: [
          ['Blank', formatBlank(analysis)],
          ['Sheet Used', `${Math.round(breakdown.sheetUtilisation * 100)}% of bought sheet`],
          ['Material Cost', `${formatInr(breakdown.materialCost)} / unit`],
        ],
        note: 'Nesting efficiency improves as batch size increases.',
      },
      {
        icon: <Zap size={14} className="text-lp-primary" />,
        label: 'Laser Cutting Ops',
        title: laser,
        rows: [
          ['Cut Perimeter', `${(analysis.cutLengthMm / 1000).toFixed(2)} m`],
          ['Pierces', `${analysis.pierces}`],
          ['Cut Time', `${formatDuration(breakdown.cutTimeMin)} / unit`],
          ['Cutting Cost', `${formatInr(breakdown.cutCost)} / unit`],
        ],
        note: 'Measured from your file: outer profile plus every internal cut-out.',
      },
      {
        icon: <Wrench size={14} className="text-lp-primary" />,
        label: 'Setup & Forming',
        title: breakdown.bendCount > 0 ? `${breakdown.bendCount} bend${breakdown.bendCount > 1 ? 's' : ''} on the press brake` : 'Flat part · no bending',
        rows: [
          ['Nesting & Setup', `${formatInr(breakdown.laserSetupCost)} / unit`],
          ...(breakdown.bendCount > 0 ? ([['Bending', `${formatInr(breakdown.bendingCost)} / unit`]] as const) : []),
          ['Surface Finish', `${formatInr(breakdown.finishCost)} / unit`],
        ],
        note: `Setup is a one-time job cost shared across ${quantity} unit${quantity > 1 ? 's' : ''}.`,
      },
    ];

    return (
      <div className="bg-lp-card border border-lp-border rounded-sm p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lp-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-lp-primary lp-label-mono mb-1.5">
              <Zap size={16} />
              <span>Manufacturing & Time Transparency</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-lp-fg tracking-tight">
              Laser Cutting Cost & Time Breakup
            </h3>
            <p className="text-xs text-lp-muted-fg mt-1 max-w-2xl">
              Measured from your {analysis.profileOnly ? 'DXF profile' : '3D model'}: blank size, total cut perimeter, pierces{analysis.profileOnly ? '' : ' and bends'}, priced with our laser speed cards.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2 rounded-sm text-xs font-bold shrink-0">
            <CheckCircle size={15} />
            <span>Fair & Transparent Pricing</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.label} className="bg-lp-accent border border-lp-border rounded-sm p-6 flex flex-col justify-between space-y-4">
              <div>
                <span className="flex items-center gap-1.5 lp-label-mono text-lp-muted-fg mb-2">
                  {card.icon} {card.label}
                </span>
                <p className="text-sm font-bold text-lp-fg mb-4">{card.title}</p>
                <div className="space-y-2 text-xs text-lp-muted-fg">
                  {card.rows.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-3">
                      <span>{label}</span>
                      <span className="font-lp-mono font-semibold text-lp-fg text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-lp-muted-fg bg-lp-bg/70 p-2.5 rounded-sm border border-lp-border/50">
                {card.note}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Legacy laser quotes (saved before laser pricing read the real file)
  const geometry = quote.geometry;
  const material = getMaterialById(quote.parameters.materialId);
  const cutLengthM = (geometry.cutLengthMm / 1000).toFixed(2);
  const thicknessMm = quote.parameters.thicknessMm;

  return (
    <div className="bg-lp-card border border-lp-border rounded-sm p-8 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lp-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-lp-primary lp-label-mono mb-1.5">
            <Zap size={16} />
            <span>Manufacturing & Time Transparency</span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-lp-fg tracking-tight">
            Laser Cutting Cost & Time Breakup
          </h3>
          <p className="text-xs text-lp-muted-fg mt-1 max-w-2xl">
            Derived directly from your vector contour geometry, total cut perimeter, pierces, and laser speed cards.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2 rounded-sm text-xs font-bold shrink-0">
          <CheckCircle size={15} />
          <span>Fair & Transparent Pricing</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Raw Sheet */}
        <div className="bg-lp-accent border border-lp-border rounded-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="flex items-center gap-1.5 lp-label-mono text-lp-muted-fg mb-2">
              <Boxes size={14} className="text-lp-primary" /> Sheet Material
            </span>
            <p className="text-sm font-bold text-lp-fg mb-4">
              {material?.name ?? 'Sheet Metal'} ({thicknessMm} mm)
            </p>
            <div className="space-y-2 text-xs text-lp-muted-fg">
              <div className="flex justify-between">
                <span>Bounding Box</span>
                <span className="font-lp-mono font-semibold text-lp-fg">
                  {geometry.boundingBox.widthMm.toFixed(1)} × {geometry.boundingBox.heightMm.toFixed(1)} mm
                </span>
              </div>
              <div className="flex justify-between">
                <span>Material Cost</span>
                <span className="font-lp-mono font-bold text-lp-fg">
                  {formatInr(quote.breakdown.materialCost)} / unit
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-lp-muted-fg bg-lp-bg/70 p-2.5 rounded-sm border border-lp-border/50">
            Nesting efficiency improves as batch size increases.
          </div>
        </div>

        {/* Laser Cut Ops */}
        <div className="bg-lp-accent border border-lp-border rounded-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="flex items-center gap-1.5 lp-label-mono text-lp-muted-fg mb-2">
              <Zap size={14} className="text-lp-primary" /> Laser Cutting Ops
            </span>
            <p className="text-sm font-bold text-lp-fg mb-4">Fiber Laser (High Precision)</p>
            <div className="space-y-2 text-xs text-lp-muted-fg">
              <div className="flex justify-between">
                <span>Cut Perimeter</span>
                <span className="font-lp-mono font-bold text-lp-fg">{cutLengthM} m</span>
              </div>
              <div className="flex justify-between">
                <span>Pierces & Internal Holes</span>
                <span className="font-lp-mono font-semibold text-lp-fg">
                  {geometry.holeCount} pierces
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cutting Cost</span>
                <span className="font-lp-mono font-bold text-lp-fg">
                  {formatInr(quote.breakdown.cutCost)} / unit
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-lp-muted-fg bg-lp-bg/70 p-2.5 rounded-sm border border-lp-border/50">
            Machine rate covers assist gas, optic consumables, and electricity.
          </div>
        </div>

        {/* Setup & Nesting */}
        <div className="bg-lp-accent border border-lp-border rounded-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <span className="flex items-center gap-1.5 lp-label-mono text-lp-muted-fg mb-2">
              <Wrench size={14} className="text-lp-primary" /> Job Setup & Handling
            </span>
            <p className="text-sm font-bold text-lp-fg mb-4">Batch Loading & Pallet Shuttle</p>
            <div className="space-y-2 text-xs text-lp-muted-fg">
              <div className="flex justify-between">
                <span>Setup & Nesting Fee</span>
                <span className="font-lp-mono font-semibold text-lp-fg">
                  {formatInr(quote.breakdown.setupCost)} / unit
                </span>
              </div>
              <div className="flex justify-between">
                <span>Batch Quantity</span>
                <span className="font-bold text-lp-primary">
                  {quantity} unit{quantity > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Surface Finish</span>
                <span className="font-semibold text-lp-fg">
                  {formatInr(quote.breakdown.finishCost)} / unit
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-lp-muted-fg bg-lp-bg/70 p-2.5 rounded-sm border border-lp-border/50">
            Sheet setup fee is amortized over total quantity.
          </div>
        </div>
      </div>
    </div>
  );
}

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
      toast({
        title: 'Part added to cart',
        description: `${reviewFileName} · ${reviewQuote.parameters.quantity} pcs · ₹${Math.round(reviewQuote.totalPrice).toLocaleString('en-IN')}`,
      });
    }
  };

  const handleProceedToCheckout = (): void => {
    if (reviewQuote && canOrder) {
      cart.addToCart(reviewQuote, reviewFileName);
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

  return (
    <V2Shell noFooter>
      <div className="min-h-screen relative -mt-20 pt-20">
      {/* Background dot grid */}
      <div
        className="absolute inset-0 bg-lp-bg/50"
        style={{
          backgroundImage: 'radial-gradient(oklch(0.55 0.05 250 / 0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-6xl mx-auto relative z-10 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        {/* ── Header + Stepper ── */}
        <div className="mb-12">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 lp-label-mono text-lp-primary hover:text-lp-primary/80 transition-all group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Project Hub
            </Link>
          </div>
          <h1 className="text-3xl md:text-5xl uppercase tracking-tight font-bold text-lp-fg mb-4">
            Instant Quote
          </h1>
          <p className="text-lp-muted-fg text-lg mb-8 font-medium">
            Upload your file, configure options, get a price in seconds.
          </p>

          {/* Step indicators */}
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-lp-border z-0 rounded-full overflow-hidden">
              <div
                className="h-full bg-lp-primary transition-all duration-700 ease-in-out"
                style={{ width: stepIndex === 0 ? '0%' : stepIndex === 1 ? '50%' : '100%' }}
              />
            </div>
            {[
              { key: 'upload', label: 'Upload' },
              { key: 'configure', label: 'Configure' },
              { key: 'review', label: 'Review' },
            ].map((s, i) => {
              const isActive = i === stepIndex;
              const isPast = i < stepIndex;
              return (
                <div key={s.key} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-sm flex items-center justify-center font-bold text-sm transition-all duration-500 border-2 ${isActive
                        ? 'bg-lp-primary border-lp-primary text-white shadow-sm scale-110'
                        : isPast
                          ? 'bg-lp-primary border-lp-primary text-white'
                          : 'bg-lp-card border-lp-border text-lp-muted-fg'
                      }`}
                  >
                    {isPast ? <CheckCircle size={20} /> : <span>{i + 1}</span>}
                  </div>
                  <span
                    className={`mt-3 lp-label-mono ${isActive || isPast ? 'text-lp-primary' : 'text-lp-muted-fg'}`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═══ SIGN-IN REQUIRED ═══ */}
        {needsSignIn && (
          <div className="max-w-xl mx-auto bg-lp-card border border-lp-border rounded-sm p-10 shadow-sm text-center">
            <div className="w-16 h-16 bg-lp-accent border border-lp-border rounded-sm flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-8 h-8 text-lp-primary" />
            </div>
            <h3 className="text-xl uppercase tracking-tight font-bold text-lp-fg mb-2">
              Sign in for instant pricing
            </h3>
            <p className="text-sm text-lp-muted-fg mb-8">
              CNC machining and laser cutting quotes are available to registered MechHub users.
              {shareRef ? ` Sign in to view quote ${shareRef}.` : ''}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={loginHref}
                className="px-8 py-4 rounded-sm bg-lp-primary hover:bg-lp-ink/80 text-white lp-label-mono transition-all"
              >
                Sign In
              </Link>
              <Link
                href={registerHref}
                className="px-8 py-4 rounded-sm border border-lp-border bg-lp-card text-lp-primary lp-label-mono hover:border-lp-primary/50 transition-all"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* ═══ STEP 1: UPLOAD ═══ */}
        {!needsSignIn && step === 'upload' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            <div
              className={`border-2 border-dashed rounded-sm p-16 text-center bg-lp-card transition-all cursor-pointer group shadow-sm relative overflow-hidden ${fileUpload.isDragging
                  ? 'border-lp-primary bg-lp-accent/50 scale-[1.02]'
                  : fileUpload.files.length > 0
                    ? 'border-lp-primary/30 hover:border-lp-primary/50'
                    : 'border-lp-border hover:border-lp-primary/50 hover:bg-lp-accent/80'
                }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                fileUpload.setDragging(true);
              }}
              onDragLeave={() => fileUpload.setDragging(false)}
              onDrop={fileUpload.handleFileDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept={fileUpload.acceptedFormats}
                multiple
                onChange={fileUpload.handleFileSelect}
              />
              <div className="w-24 h-24 bg-lp-accent border border-lp-border rounded-sm flex items-center justify-center mx-auto mb-8 group-hover:scale-105 group-hover:bg-lp-ink transition-all shadow-lg relative z-10">
                <UploadCloud className="w-12 h-12 text-lp-primary group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl uppercase tracking-tight font-bold mb-3 text-lp-fg relative z-10">
                {fileUpload.files.length > 0 ? 'Add More Files' : 'Upload CAD Files'}
              </h3>
              <p className="text-lp-muted-fg font-bold uppercase tracking-widest mb-8 text-[11px] relative z-10">
                Drag and drop or click to upload — DXF, STEP, STP
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-[10px] text-lp-primary lp-label-mono relative z-10">
                {['.DXF', '.STEP', '.STP'].map((fmt) => (
                  <span
                    key={fmt}
                    className="bg-lp-accent px-4 py-2 rounded-sm border border-lp-border"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>

            {/* File list */}
            {fileUpload.files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-lp-primary" />
                    <span className="text-sm font-bold text-lp-fg">
                      {fileUpload.files.length} {fileUpload.files.length === 1 ? 'file' : 'files'}{' '}
                      uploaded
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {fileUpload.files.map((f) => (
                    <div
                      key={f.id}
                      className={`flex items-center gap-4 px-5 py-4 rounded-sm bg-lp-card border transition-all cursor-pointer group shadow-sm ${f.id === fileUpload.activeFileId
                          ? 'border-lp-primary ring-1 ring-lp-primary/20 shadow-md'
                          : 'border-lp-border hover:border-lp-primary/30'
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileUpload.setActiveFile(f.id);
                      }}
                    >
                      <div className="w-10 h-10 rounded-sm bg-lp-accent border border-lp-border flex items-center justify-center">
                        <FileText className="w-5 h-5 text-lp-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-lp-fg text-sm truncate">{f.fileName}</p>
                        <p className="text-[10px] text-lp-muted-fg font-bold uppercase tracking-widest">
                          {(f.fileSizeBytes / 1024).toFixed(0)} KB ·{' '}
                          {f.fileName.toLowerCase().endsWith('.dxf') ? '2D profile' : '3D model'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.status === 'ready' && (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        )}
                        {f.status === 'uploading' && (
                          <Loader2 className="w-5 h-5 text-lp-primary animate-spin" />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileUpload.removeFile(f.id);
                          }}
                          className="p-2 rounded-sm text-lp-muted-fg hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-8 text-[11px] lp-label-mono text-lp-muted-fg">
              <span className="flex items-center gap-2.5">
                <Shield size={16} className="text-emerald-500" /> NDA Protected
              </span>
              <span className="flex items-center gap-2.5">
                <Zap size={16} className="text-lp-primary" /> Instant Price
              </span>
            </div>

            <button
              onClick={handleContinueToConfigure}
              disabled={fileUpload.files.length === 0}
              className="w-full bg-lp-primary hover:bg-lp-ink/80 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-white lp-label-mono text-[11px] py-5 px-10 rounded-sm transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              Configure Quote <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ═══ STEP 2: CONFIGURE ═══ */}
        {!needsSignIn && step === 'configure' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            {/* Active file indicator */}
            {activeFile && (
              <div className="flex items-center justify-between mb-8 bg-lp-card border border-lp-border p-5 rounded-sm shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-lp-accent rounded-sm border border-lp-border">
                    <FileText size={20} className="text-lp-primary" />
                  </div>
                  <div>
                    <span className="font-bold text-lp-fg block">{activeFile.fileName}</span>
                    <span className="text-[10px] text-lp-muted-fg font-bold uppercase tracking-widest">
                      {isCnc
                        ? cnc.analysis
                          ? `${cnc.analysis.part.boundingBox.x}×${cnc.analysis.part.boundingBox.y}×${cnc.analysis.part.boundingBox.z}mm · ${cnc.analysis.features.holeCount} holes`
                          : cnc.analysisStatus === 'analyzing'
                            ? 'Analyzing...'
                            : '—'
                        : sheet.analysis
                          ? `${formatBlank(sheet.analysis)} · ${sheet.analysis.holes.reduce((n, h) => n + h.count, 0)} holes`
                          : sheet.analysisStatus === 'analyzing'
                            ? 'Analyzing...'
                            : '—'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setStep('upload')}
                  className="lp-label-mono text-lp-primary hover:text-lp-primary/80 flex items-center gap-1.5 transition-colors bg-lp-accent px-4 py-2 rounded-sm border border-lp-border"
                >
                  <X size={14} /> Change File
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Configuration Selectors */}
              <div className="lg:col-span-2 bg-lp-card border border-lp-border rounded-sm p-8 md:p-10 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-lp-primary" />

                {/* Process */}
                <div className="space-y-2 mt-4">
                  <label className="block text-[11px] font-bold text-lp-muted-fg uppercase tracking-widest ml-1">
                    Process
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PROCESS_OPTIONS.map(({ mode, label, hint, Icon }) => (
                      <button
                        key={mode}
                        onClick={() => setProcessMode(mode)}
                        aria-pressed={processMode === mode}
                        className={`px-4 py-3 rounded-sm text-left transition-all border flex items-center gap-3 ${processMode === mode
                            ? 'bg-lp-primary text-white border-lp-primary shadow-lg'
                            : 'bg-lp-card text-lp-muted-fg border-lp-border hover:border-lp-primary/50 hover:text-lp-primary/80'
                          }`}
                      >
                        <Icon size={18} className="shrink-0" />
                        <span>
                          <span className="block lp-label-mono">
                            {label}
                          </span>
                          <span
                            className={`block text-[10px] font-medium mt-0.5 ${processMode === mode ? 'text-lp-muted-fg' : 'text-lp-muted-fg'
                              }`}
                          >
                            {hint}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CNC part analysis */}
                {isCnc && (
                  <div className="mt-6">
                    {cnc.analysisStatus === 'analyzing' && (
                      <div className="flex items-center gap-3 p-4 rounded-sm bg-lp-accent border border-lp-border">
                        <Loader2 className="w-5 h-5 text-lp-primary animate-spin shrink-0" />
                        <p className="text-xs font-bold text-lp-primary">
                          Analysing part geometry — stock, setups and machining time…
                        </p>
                      </div>
                    )}
                    {cnc.analysisStatus === 'unsupported_file' && (
                      <div className="flex items-start gap-3 p-4 rounded-sm bg-amber-50 border border-amber-200">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-amber-700">
                          CNC quotes need a STEP file (.step or .stp). Upload the 3D model of this
                          part to price it for machining.
                        </p>
                      </div>
                    )}
                    {cnc.analysisStatus === 'error' && (
                      <div className="flex items-start justify-between gap-3 p-4 rounded-sm bg-red-50 border border-red-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-xs font-bold text-red-700">{cnc.error}</p>
                        </div>
                        <button
                          onClick={cnc.retryAnalysis}
                          className="shrink-0 lp-label-mono text-red-700 hover:text-red-900 flex items-center gap-1.5 bg-lp-card px-3 py-2 rounded-sm border border-red-200"
                        >
                          <RefreshCw size={12} /> Retry
                        </button>
                      </div>
                    )}
                    {cnc.analysis && (
                      <div className="space-y-3">
                        {cnc.processMismatch && (
                          <div className="flex items-start gap-3 p-4 rounded-sm bg-lp-accent border border-lp-border">
                            <Info className="w-5 h-5 text-lp-primary shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-lp-primary">
                              This part is best made by{' '}
                              {CNC_PROCESS_LABELS[cnc.analysis.process.recommended]}, so it is
                              priced for that process.
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            ['Recommended', CNC_PROCESS_LABELS[cnc.analysis.process.recommended]],
                            ['Stock', formatCncStock(cnc.analysis.stock)],
                            [
                              'Setups',
                              `${cnc.analysis.setups.count}${cnc.analysis.setups.directions.length > 0
                                ? ` (${cnc.analysis.setups.directions.join(', ')})`
                                : ''
                              }`,
                            ],
                            [
                              'Cycle Time',
                              cnc.quoteResult
                                ? `${cnc.quoteResult.breakdown.cycleTimeMin.toFixed(1)} min/part`
                                : '—',
                            ],
                          ].map(([lbl, val]) => (
                            <div
                              key={lbl}
                              className="p-3 rounded-sm bg-lp-accent border border-lp-border"
                            >
                              <p className="lp-label-mono text-lp-muted-fg">
                                {lbl}
                              </p>
                              <p className="text-xs font-bold text-lp-fg mt-1">{val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Laser part analysis — the converter measures the real file */}
                {!isCnc && (
                  <div className="mt-6">
                    {sheet.analysisStatus === 'analyzing' && (
                      <div className="flex items-center gap-3 p-4 rounded-sm bg-lp-accent border border-lp-border">
                        <Loader2 className="w-5 h-5 text-lp-primary animate-spin shrink-0" />
                        <p className="text-xs font-bold text-lp-primary">
                          Measuring your part — flat blank, cut length, pierces and bends…
                        </p>
                      </div>
                    )}
                    {sheet.analysisStatus === 'unsupported_file' && (
                      <div className="flex items-start gap-3 p-4 rounded-sm bg-amber-50 border border-amber-200">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold text-amber-700">
                          Laser quotes need a STEP (.step, .stp) or DXF file. Upload the part&apos;s
                          3D model or its flat profile to price it.
                        </p>
                      </div>
                    )}
                    {sheet.analysisStatus === 'error' && sheet.errorCode === ErrorCode.NOT_SHEET_METAL && (
                      <div className="flex items-start justify-between gap-3 p-4 rounded-sm bg-amber-50 border border-amber-200">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs font-bold text-amber-700">
                            {sheet.error} Laser cutting needs a part cut from one flat sheet of
                            constant thickness. Solid parts are priced by CNC machining.
                          </p>
                        </div>
                        <button
                          onClick={() => setProcessMode('cnc_milling')}
                          className="shrink-0 lp-label-mono text-amber-800 hover:text-amber-950 flex items-center gap-1.5 bg-lp-card px-3 py-2 rounded-sm border border-amber-200"
                        >
                          <Cog size={12} /> Price as CNC
                        </button>
                      </div>
                    )}
                    {sheet.analysisStatus === 'error' && sheet.errorCode !== ErrorCode.NOT_SHEET_METAL && (
                      <div className="flex items-start justify-between gap-3 p-4 rounded-sm bg-red-50 border border-red-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          <p className="text-xs font-bold text-red-700">{sheet.error}</p>
                        </div>
                        <button
                          onClick={sheet.retryAnalysis}
                          className="shrink-0 lp-label-mono text-red-700 hover:text-red-900 flex items-center gap-1.5 bg-lp-card px-3 py-2 rounded-sm border border-red-200"
                        >
                          <RefreshCw size={12} /> Retry
                        </button>
                      </div>
                    )}
                    {sheet.analysis && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          ['Blank', formatBlank(sheet.analysis)],
                          ['Cut Length', `${(sheet.analysis.cutLengthMm / 1000).toFixed(2)} m`],
                          ['Pierces', `${sheet.analysis.pierces}`],
                          sheet.analysis.profileOnly
                            ? ['Thickness', 'Pick below (DXF)']
                            : ['Model', `${sheet.analysis.thicknessMm} mm · ${sheet.analysis.bends.length} bend${sheet.analysis.bends.length === 1 ? '' : 's'}`],
                        ].map(([lbl, val]) => (
                          <div key={lbl} className="p-3 rounded-sm bg-lp-accent border border-lp-border">
                            <p className="lp-label-mono text-lp-muted-fg">{lbl}</p>
                            <p className="text-xs font-bold text-lp-fg mt-1">{val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                  {/* Material */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-lp-muted-fg uppercase tracking-widest ml-1">
                      Material
                    </label>
                    <select
                      value={config.state.materialId}
                      onChange={(e) => config.setMaterialId(e.target.value)}
                      className="w-full bg-lp-accent border border-lp-border rounded-sm px-5 py-4 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-4 focus:ring-lp-primary/5 hover:border-lp-border appearance-none custom-select transition-all font-medium"
                    >
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
                      <label className="block text-[11px] font-bold text-lp-muted-fg uppercase tracking-widest ml-1">
                        Thickness
                      </label>
                      <select
                        value={sheet.state.thicknessMm}
                        onChange={(e) => sheet.setThicknessMm(Number(e.target.value))}
                        className="w-full bg-lp-accent border border-lp-border rounded-sm px-5 py-4 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-4 focus:ring-lp-primary/5 hover:border-lp-border appearance-none custom-select transition-all font-medium"
                      >
                        {sheet.availableThicknesses.map((t) => (
                          <option key={t} value={t}>
                            {t}mm
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Finish */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-lp-muted-fg uppercase tracking-widest ml-1">
                      Surface Finish
                    </label>
                    <select
                      value={config.state.finishType}
                      onChange={(e) => config.setFinishType(e.target.value as never)}
                      className="w-full bg-lp-accent border border-lp-border rounded-sm px-5 py-4 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-4 focus:ring-lp-primary/5 hover:border-lp-border appearance-none custom-select transition-all font-medium"
                    >
                      {config.availableFinishes.map((f) => (
                        <option key={f.type} value={f.type}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-lp-muted-fg uppercase tracking-widest ml-1">
                      Quantity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={config.state.quantity}
                        onChange={(e) => config.setQuantity(Number(e.target.value))}
                        className="w-full bg-lp-accent border border-lp-border rounded-sm px-5 py-4 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-4 focus:ring-lp-primary/5 hover:border-lp-border transition-all font-bold"
                      />
                      {config.savingsPercent > 0 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 lp-label-mono bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-sm flex items-center gap-1">
                          <Zap size={10} /> {config.savingsPercent}% off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Turnaround */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-[11px] font-bold text-lp-muted-fg uppercase tracking-widest ml-1">
                      Turnaround
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {config.turnaroundOptions.map((opt) => (
                        <button
                          key={opt.type}
                          onClick={() => config.setTurnaround(opt.type)}
                          className={`px-4 py-3 rounded-sm lp-label-mono transition-all border text-center ${config.state.turnaround === opt.type
                              ? 'bg-lp-primary text-white border-lp-primary shadow-lg'
                              : 'bg-lp-card text-lp-muted-fg border-lp-border hover:border-lp-primary/50 hover:text-lp-primary/80'
                            }`}
                        >
                          <span className="block">
                            {opt.days === 0 ? 'Same Day' : `${opt.days}d`}
                          </span>
                          <span
                            className={`block mt-1 ${config.state.turnaround === opt.type
                                ? 'text-lp-muted-fg'
                                : 'text-lp-muted-fg'
                              }`}
                          >
                            {opt.multiplier === 1
                              ? 'Base'
                              : opt.multiplier < 1
                                ? `−${Math.round((1 - opt.multiplier) * 100)}%`
                                : `+${Math.round((opt.multiplier - 1) * 100)}%`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

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

                {/* DFM Feedback */}
                {config.dfmIssues.length > 0 && (
                  <div className="mt-8 space-y-3">
                    <h4 className="lp-label-mono text-lp-muted-fg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> DFM Feedback
                    </h4>
                    {config.dfmIssues.map((issue: DFMIssue, idx: number) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-sm border ${issue.blocking
                            ? 'bg-red-50 border-red-200'
                            : 'bg-amber-50 border-amber-200'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {issue.blocking ? (
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <p
                              className={`text-xs font-bold ${issue.blocking ? 'text-red-700' : 'text-amber-700'}`}
                            >
                              {issue.message}
                            </p>
                            <p className="text-[10px] text-lp-muted-fg mt-1 font-medium">
                              💡 {issue.fixSuggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Save failure — stay on Configure so the customer can retry */}
                {saved.status === 'error' && !isShared && saved.error && (
                  <div className="mt-8 flex items-start gap-3 p-4 rounded-sm bg-red-50 border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-bold text-red-700">
                      Couldn&apos;t save your quote: {saved.error}
                    </p>
                  </div>
                )}

                {/* CTA buttons */}
                <div className="mt-10 pt-8 border-t border-lp-border flex justify-between items-center">
                  <button
                    onClick={() => setStep('upload')}
                    className="px-8 py-4 rounded-sm border border-lp-border bg-lp-card text-lp-muted-fg hover:text-lp-fg hover:border-lp-border transition-all lp-label-mono"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleGetQuote}
                    disabled={
                      !activeQuote ||
                      config.hasBlockingIssues ||
                      isCalculating ||
                      saved.status === 'saving'
                    }
                    className="bg-lp-primary hover:bg-lp-ink/80 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-white lp-label-mono text-[11px] py-4 px-10 rounded-sm transition-all flex items-center gap-2 transform active:scale-95"
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Calculating...
                      </>
                    ) : saved.status === 'saving' ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving Quote...
                      </>
                    ) : (
                      <>
                        Review Quote <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: Live Price Sidebar */}
              <div className="space-y-6">
                {/* Live Price Display */}
                <div className="bg-lp-card border border-lp-border rounded-sm p-8 shadow-sm sticky top-28">
                  <h3 className="lp-label-mono text-lp-primary mb-6">
                    Live Price
                  </h3>

                  {isCalculating ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-lp-primary animate-spin" />
                    </div>
                  ) : activeQuote ? (
                    <div className="space-y-6">
                      <div>
                        <p className="text-4xl font-bold text-lp-fg tracking-tighter">
                          ₹{activeQuote.pricePerPart.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-lp-muted-fg uppercase tracking-widest font-bold mt-1">
                          {isCnc ? 'per part · estimate' : 'per part'}
                        </p>
                      </div>

                      <div className="p-4 bg-lp-accent rounded-sm border border-lp-border">
                        <div className="flex justify-between items-center">
                          <span className="lp-label-mono text-lp-muted-fg">
                            Total ({config.state.quantity} pcs)
                          </span>
                          <span className="text-xl font-bold text-lp-fg">
                            ₹{activeQuote.totalPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      {/* Breakdown */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="lp-label-mono text-lp-muted-fg">
                            Cost Breakdown
                          </h4>
                          {isCncQuote(activeQuote) && (
                            <button
                              type="button"
                              onClick={() => setShowSidebarTimes((prev) => !prev)}
                              className="text-[10px] lp-label-mono text-lp-primary hover:underline flex items-center gap-1"
                            >
                              {showSidebarTimes ? 'Hide Times' : 'Show Times'}
                              {showSidebarTimes ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          )}
                        </div>
                        {breakdownRows.map(([label, cost]) => (
                          <div key={label} className="flex justify-between text-xs">
                            <span className="text-lp-muted-fg lp-label-mono">
                              {label}
                            </span>
                            <span className="text-lp-fg font-bold font-lp-mono">
                              {formatInr(cost)}
                            </span>
                          </div>
                        ))}
                        {isCncQuote(activeQuote) && showSidebarTimes && (
                          <div className="mt-2 p-3 rounded-sm bg-lp-accent/60 border border-lp-border/80 space-y-2 text-[11px]">
                            <div className="flex justify-between text-lp-muted-fg">
                              <span className="flex items-center gap-1 font-medium">
                                <Cog size={12} className="text-lp-primary" /> Machine Time
                              </span>
                              <span className="font-lp-mono font-bold text-lp-fg">
                                {formatDuration(activeQuote.breakdown.cycleTimeMin)} / unit
                              </span>
                            </div>
                            <div className="flex justify-between text-lp-muted-fg">
                              <span className="flex items-center gap-1 font-medium">
                                <Wrench size={12} className="text-lp-primary" /> Setups ({activeQuote.analysis.setups.count})
                              </span>
                              <span className="font-lp-mono text-lp-fg">
                                {formatDuration(activeQuote.analysis.setupTimeMin)} setup
                              </span>
                            </div>
                            <div className="flex justify-between text-lp-muted-fg">
                              <span className="flex items-center gap-1 font-medium">
                                <Boxes size={12} className="text-lp-primary" /> Stock
                              </span>
                              <span
                                className="font-lp-mono text-lp-fg text-right text-[10px] max-w-[150px] truncate"
                                title={formatCncStock(activeQuote.analysis.stock)}
                              >
                                {formatCncStock(activeQuote.analysis.stock)}
                              </span>
                            </div>
                          </div>
                        )}
                        <div className="h-px bg-lp-border my-2" />
                        <div className="flex justify-between text-xs">
                          <span className="text-lp-primary lp-label-mono">
                            Qty Discount
                          </span>
                          <span className="text-emerald-600 font-bold">
                            −{config.savingsPercent}%
                          </span>
                        </div>
                        {activeQuote.breakdown.rushMultiplier !== 1 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-lp-primary lp-label-mono">
                              Rush Fee
                            </span>
                            <span className="text-amber-600 font-bold">
                              +{Math.round((activeQuote.breakdown.rushMultiplier - 1) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Lead time */}
                      <div className="flex items-center gap-3 p-3 rounded-sm bg-lp-accent border border-lp-border">
                        <Clock className="w-4 h-4 text-lp-primary" />
                        <span className="lp-label-mono text-lp-primary">
                          Est.{' '}
                          {activeQuote.leadTimeDays === 0
                            ? 'Same Day'
                            : `${activeQuote.leadTimeDays} Day${activeQuote.leadTimeDays > 1 ? 's' : ''}`}
                        </span>
                      </div>

                      {isCnc && (
                        <p className="text-[10px] text-lp-muted-fg font-medium leading-relaxed">
                          Instant CNC prices are estimates from your part&apos;s geometry. Our
                          engineers confirm the final price before machining starts.
                        </p>
                      )}
                    </div>
                  ) : config.error ? (
                    <div className="p-4 rounded-sm bg-red-50 border border-red-200">
                      <p className="text-xs text-red-600 font-bold">{config.error}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-lp-muted-fg py-12 text-center">
                      Upload a file to see live pricing
                    </p>
                  )}
                </div>

                {/* Tier Pricing Table */}
                {config.tierPricing.length > 0 && (
                  <div className="bg-lp-card border border-lp-border rounded-sm p-6 shadow-sm">
                    <h4 className="lp-label-mono text-lp-muted-fg mb-4">
                      Tier Pricing
                    </h4>
                    <div className="space-y-2">
                      {config.tierPricing.slice(0, 6).map((tier: QuantityTier) => (
                        <div
                          key={tier.quantity}
                          className={`flex justify-between items-center py-2 px-3 rounded-sm text-xs ${tier.quantity === config.state.quantity
                              ? 'bg-lp-primary text-white'
                              : 'hover:bg-lp-accent/80'
                            }`}
                        >
                          <span
                            className={`font-bold ${tier.quantity === config.state.quantity ? 'text-lp-muted-fg' : 'text-lp-muted-fg'} uppercase tracking-widest text-[10px]`}
                          >
                            {tier.quantity} pc{tier.quantity > 1 ? 's' : ''}
                          </span>
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-bold font-lp-mono ${tier.quantity === config.state.quantity ? 'text-white' : 'text-lp-fg'}`}
                            >
                              ₹{tier.pricePerPart.toLocaleString('en-IN')}
                            </span>
                            {tier.savingsPercent > 0 && (
                              <span
                                className={`text-[9px] font-bold ${tier.quantity === config.state.quantity ? 'text-lp-muted-fg' : 'text-emerald-500'}`}
                              >
                                −{tier.savingsPercent}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: REVIEW — shared link loading / not found ═══ */}
        {!needsSignIn && step === 'review' && !reviewQuote && isSharedLoadPending(shareRef, saved.status) && (
          <div className="max-w-xl mx-auto bg-lp-card border border-lp-border rounded-sm p-10 shadow-sm text-center">
            {saved.status === 'loading' ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-lp-primary animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest text-lp-primary">
                  Loading quote {shareRef}…
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <p className="text-sm font-bold text-lp-fg">{saved.error}</p>
                <div className="flex gap-3">
                  <button
                    onClick={saved.retryShared}
                    className="px-6 py-3 rounded-sm border border-lp-border bg-lp-card text-lp-primary lp-label-mono flex items-center gap-2"
                  >
                    <RefreshCw size={12} /> Retry
                  </button>
                  <button
                    onClick={handleStartNewQuote}
                    className="px-6 py-3 rounded-sm bg-lp-primary text-white lp-label-mono"
                  >
                    Start a New Quote
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3: REVIEW ═══ */}
        {!needsSignIn && step === 'review' && reviewQuote && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
            {/* Main quote panel */}
            <div className="bg-lp-card border border-lp-border shadow-sm rounded-sm overflow-hidden relative">
              {/* Header */}
              <div className="px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-lp-border bg-lp-accent/30">
                <div>
                  <h2 className="text-2xl uppercase tracking-tight font-bold text-lp-fg">
                    Your Quote
                  </h2>
                  <p className="text-[10px] text-lp-muted-fg mt-1 uppercase tracking-[0.2em] font-bold">
                    {isCncQuote(reviewQuote) ? 'Estimate · ' : ''}
                    {isExpired
                      ? `Expired at ${formatTime(reviewQuote.expiresAt)}`
                      : `Valid until ${formatTime(reviewQuote.expiresAt)}`}{' '}
                    · {reviewFileName}
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-lp-card border border-lp-border rounded-sm px-5 py-3 shadow-sm">
                  <span className="text-[10px] text-lp-primary font-bold uppercase tracking-widest">
                    Quote Ref
                  </span>
                  <span className="text-sm font-bold text-lp-fg uppercase tracking-tight">
                    {reviewQuote.quoteRef}
                  </span>
                </div>
              </div>

              {/* Price display */}
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-10 flex flex-col justify-center bg-lp-card">
                  <div className="mb-2">
                    <span className="text-5xl md:text-7xl font-bold tracking-tighter text-lp-fg block">
                      ₹{reviewQuote.totalPrice.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-lp-muted-fg flex items-center gap-2 uppercase tracking-widest font-bold mt-4">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Total for{' '}
                    {reviewQuote.parameters.quantity} parts · ₹
                    {reviewQuote.pricePerPart.toLocaleString('en-IN')}/part
                  </p>
                </div>

                {/* Spec snapshot */}
                <div className="w-full md:w-96 p-10 bg-lp-accent/50 flex flex-col justify-center">
                  <h4 className="lp-label-mono text-lp-primary mb-6">
                    Specification
                  </h4>
                  <ul className="space-y-4">
                    {quoteSpecRows(reviewQuote).map(([lbl, val]) => (
                      <li key={lbl} className="flex justify-between items-center">
                        <span className="text-[10px] lp-label-mono text-lp-muted-fg">
                          {lbl}
                        </span>
                        <span className="text-xs font-bold text-lp-fg text-right">{val}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bottom metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-lp-border border-t border-lp-border bg-lp-card">
                <div className="p-8 flex flex-col items-center sm:items-start group hover:bg-lp-accent/80 transition-colors">
                  <p className="lp-label-mono text-lp-muted-fg mb-3">
                    Per Part
                  </p>
                  <p className="text-3xl font-bold text-lp-fg">
                    ₹{reviewQuote.pricePerPart.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-8 flex flex-col items-center sm:items-start group hover:bg-lp-accent/80 transition-colors">
                  <p className="lp-label-mono text-lp-muted-fg mb-3">
                    Quantity
                  </p>
                  <p className="text-3xl font-bold text-lp-fg">
                    {reviewQuote.parameters.quantity}{' '}
                    <span className="text-xs font-bold uppercase tracking-widest text-lp-muted-fg ml-1">
                      Units
                    </span>
                  </p>
                </div>
                <div className="p-8 flex flex-col items-center sm:items-start relative overflow-hidden group hover:bg-lp-ink transition-all duration-500">
                  <div className="absolute inset-0 bg-lp-primary/5 group-hover:bg-lp-ink transition-colors" />
                  <p className="lp-label-mono text-lp-primary mb-3 relative z-10 group-hover:text-lp-muted-fg">
                    Lead Time
                  </p>
                  <p className="text-3xl font-bold text-lp-fg relative z-10 group-hover:text-white transition-colors">
                    {reviewQuote.leadTimeDays === 0 ? 'Same Day' : reviewQuote.leadTimeDays}{' '}
                    <span className="text-xs font-bold uppercase tracking-widest text-lp-muted-fg ml-1 group-hover:text-lp-muted-fg">
                      {reviewQuote.leadTimeDays > 0 ? 'Days' : ''}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Manufacturing & Cost Transparency Deep Dive */}
            <ManufacturingTransparencySection
              quote={reviewQuote}
              quantity={reviewQuote.parameters.quantity}
            />

            {(isExpired || reviewQuote.hasBlockingIssues) && (
              <div className="flex items-start justify-between gap-4 p-5 rounded-sm bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-amber-700">
                    {reviewQuote.hasBlockingIssues
                      ? 'This part has blocking manufacturability issues and cannot be ordered as quoted.'
                      : isShared
                        ? 'This quote has expired. Upload the part again to get a current price.'
                        : 'This quote has expired. Refresh it to lock a current price.'}
                  </p>
                </div>
                {isExpired && !isShared && (
                  <button
                    onClick={handleGetQuote}
                    disabled={saved.status === 'saving' || !activeQuote}
                    className="shrink-0 lp-label-mono text-amber-700 flex items-center gap-1.5 bg-lp-card px-3 py-2 rounded-sm border border-amber-200 disabled:opacity-40"
                  >
                    <RefreshCw size={12} /> Refresh Price
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="bg-lp-ink border border-lp-ink p-10 rounded-sm flex flex-col xl:flex-row items-center justify-between gap-8 shadow-sm relative overflow-hidden group">
              <div
                className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative z-10">
                <p className="text-[10px] text-lp-muted-fg uppercase tracking-[0.3em] font-bold mb-2">
                  Ready to order?
                </p>
                <p className="text-sm text-white max-w-sm uppercase tracking-widest leading-relaxed font-bold">
                  Proceed to checkout to lock this price and start manufacturing.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-end w-full xl:w-auto relative z-10">
                <button
                  onClick={handleCopyLink}
                  className="px-8 py-4 rounded-sm border border-white/20 bg-white/10 text-white lp-label-mono hover:bg-white/20 transition-all flex items-center gap-2"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Share Quote'}
                </button>
                <button
                  onClick={isShared ? handleStartNewQuote : () => setStep('configure')}
                  className="px-8 py-4 rounded-sm border border-white/20 bg-white/10 text-white lp-label-mono hover:bg-white/20 transition-all"
                >
                  {isShared ? 'New Quote' : 'Edit Config'}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={!canOrder}
                  className="px-8 py-4 rounded-sm border border-white/20 bg-white/10 text-white lp-label-mono hover:bg-white/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UploadCloud size={14} /> Add to Cart ({cart.itemCount})
                </button>
                <button
                  onClick={handleProceedToCheckout}
                  disabled={!canOrder}
                  className="px-10 py-4 rounded-sm bg-white text-lp-primary lp-label-mono shadow-sm hover:shadow-sm transition-all hover:scale-[1.05] active:scale-95 flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  Proceed to Checkout <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom select arrow styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .custom-select {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394A3B8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 1rem center;
            background-repeat: no-repeat;
            background-size: 1.5em 1.5em;
            padding-right: 2.5rem;
          }
        `,
        }}
      />
      </div>
    </V2Shell>
  );
}
