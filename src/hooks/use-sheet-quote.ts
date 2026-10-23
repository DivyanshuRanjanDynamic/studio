'use client';

// ═══════════════════════════════════════════════════
// use-sheet-quote — laser branch of the instant quote
// One server-side sheet analysis per file (cached by SHA-256): the converter
// measures the real STEP or DXF, then every material / thickness / finish /
// quantity / turnaround change re-prices locally with the sheet engine.
// The browser never sends geometry; quotes reference the stored analysisId.
// ═══════════════════════════════════════════════════

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  DFMIssue,
  FinishType,
  QuantityTier,
  QuoteProcessMode,
  SheetAnalysis,
  SheetQuoteRequest,
  SheetQuoteResult,
  TurnaroundType,
} from '@/types/quoting';
import { generateSheetQuote, getSheetTierTable } from '@/lib/quoting/sheet-metal';
import { getSheetMaterial } from '@/lib/quoting/sheet-rates';
import { getFinishRate, TURNAROUND_OPTIONS } from '@/lib/quoting/materials';
import { MATERIAL_CATALOG } from '@/lib/data/material-data';
import { analyzeSheetPart, type SheetAnalysisHandle } from '@/services/quoteApi.service';
import { calibrateQuote, calibrateTiers, resolveMultiplier } from '@/lib/quoting/pricing-calibration';
import { usePricingCalibration } from '@/hooks/use-pricing-calibration';
import type { Result } from '@/utils/result';
import type { AppError, ErrorCode } from '@/utils/errors';

const SHEET_EXTENSIONS = ['.step', '.stp', '.dxf'];
/** Picked for DXF profiles (no thickness in the file) when the material offers it */
const PREFERRED_DXF_THICKNESS_MM = 2;

export interface SheetMaterialOption {
  readonly id: string;
  readonly name: string;
  readonly alloy: string;
  readonly thicknesses: readonly number[];
}

/** Sheet materials the laser can price instantly, with the thicknesses we stock */
export const SHEET_MATERIAL_OPTIONS: readonly SheetMaterialOption[] =
  MATERIAL_CATALOG.sheet_metal_cutting.categories.flatMap((c) =>
    c.materials
      .filter((m) => getSheetMaterial(m.id) !== undefined && (m.thicknesses?.length ?? 0) > 0)
      .map((m) => ({ id: m.id, name: m.name, alloy: m.grade, thicknesses: m.thicknesses ?? [] }))
  );

export interface SheetQuoteState {
  materialId: string;
  /** null until the customer picks one: follows the model's thickness instead */
  thicknessMm: number | null;
  finishType: FinishType;
  quantity: number;
  turnaround: TurnaroundType;
}

export type SheetAnalysisStatus = 'idle' | 'unsupported_file' | 'analyzing' | 'ready' | 'error';

export interface UseSheetQuoteReturn {
  state: SheetQuoteState & { thicknessMm: number };
  /** What is priced and saved */
  request: SheetQuoteRequest;
  setMaterialId: (id: string) => void;
  setThicknessMm: (mm: number) => void;
  setFinishType: (type: FinishType) => void;
  setQuantity: (qty: number) => void;
  setTurnaround: (type: TurnaroundType) => void;
  materials: readonly SheetMaterialOption[];
  availableThicknesses: readonly number[];
  availableFinishes: ReadonlyArray<{ type: FinishType; label: string }>;
  turnaroundOptions: typeof TURNAROUND_OPTIONS;
  analysisStatus: SheetAnalysisStatus;
  analysis: SheetAnalysis | null;
  /** Server-stored analysis this quote is priced from (sent when saving) */
  analysisId: string | null;
  quoteResult: SheetQuoteResult | null;
  dfmIssues: readonly DFMIssue[];
  hasBlockingIssues: boolean;
  error: string | null;
  /** Why the analysis failed, e.g. NOT_SHEET_METAL for machined blocks */
  errorCode: ErrorCode | null;
  tierPricing: readonly QuantityTier[];
  savingsPercent: number;
  retryAnalysis: () => void;
}

export function isSheetFileName(fileName: string): boolean {
  const ext = '.' + (fileName.split('.').pop()?.toLowerCase() ?? '');
  return SHEET_EXTENSIONS.includes(ext);
}

/** The stocked thickness closest to the model's, or a sensible default for a DXF profile */
export function defaultThickness(options: readonly number[], analysis: SheetAnalysis | null): number {
  if (options.length === 0) return PREFERRED_DXF_THICKNESS_MM;
  const target =
    analysis && !analysis.profileOnly ? analysis.thicknessMm : PREFERRED_DXF_THICKNESS_MM;
  return options.reduce((best, t) => (Math.abs(t - target) < Math.abs(best - target) ? t : best));
}

interface AnalysisEntry {
  key: string;
  result: Result<SheetAnalysisHandle, AppError>;
}

export function useSheetQuote(
  file: File | null,
  fileKey: string | null,
  mode: QuoteProcessMode
): UseSheetQuoteReturn {
  const materials = SHEET_MATERIAL_OPTIONS;

  const [state, setState] = useState<SheetQuoteState>({
    materialId: materials.find((m) => m.id === 'ms-crca')?.id ?? materials[0]?.id ?? '',
    thicknessMm: null,
    finishType: 'none',
    quantity: 1,
    turnaround: 'standard_3d',
  });

  // In-flight and settled analyses, keyed by file hash. Sharing the promise
  // means re-renders, StrictMode re-runs and process toggles never re-upload.
  const analyses = useRef(new Map<string, Promise<Result<SheetAnalysisHandle, AppError>>>());
  const [entry, setEntry] = useState<AnalysisEntry | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const isLaserMode = mode === 'laser';
  const fileSupported = file !== null && isSheetFileName(file.name);
  const enabled = isLaserMode && fileSupported && fileKey !== null;

  useEffect(() => {
    if (!enabled || !file || !fileKey) return;

    let cancelled = false;
    let pending = analyses.current.get(fileKey);
    if (!pending) {
      pending = analyzeSheetPart(file);
      analyses.current.set(fileKey, pending);
    }
    const thisRequest = pending;
    thisRequest.then((result) => {
      // Forget failures so the next attempt calls the service again.
      if (!result.success && analyses.current.get(fileKey) === thisRequest) {
        analyses.current.delete(fileKey);
      }
      if (!cancelled) setEntry({ key: fileKey, result });
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, file, fileKey, retryToken]);

  const retryAnalysis = useCallback(() => {
    setEntry(null);
    setRetryToken((t) => t + 1);
  }, []);

  const current = entry && entry.key === fileKey ? entry.result : null;
  const analysis = current?.success ? current.data.analysis : null;
  const analysisId = current?.success ? current.data.analysisId : null;

  const analysisStatus: SheetAnalysisStatus = !isLaserMode || !file
    ? 'idle'
    : !fileSupported
      ? 'unsupported_file'
      : !current
        ? 'analyzing'
        : current.success
          ? 'ready'
          : 'error';

  // ── Derived options ──
  const availableThicknesses = useMemo(
    () => materials.find((m) => m.id === state.materialId)?.thicknesses ?? [],
    [materials, state.materialId]
  );
  const thicknessMm =
    state.thicknessMm !== null && availableThicknesses.includes(state.thicknessMm)
      ? state.thicknessMm
      : defaultThickness(availableThicknesses, analysis);

  const availableFinishes = useMemo(
    () =>
      (getSheetMaterial(state.materialId)?.finishes ?? ['none']).map((f) => ({
        type: f,
        label: getFinishRate(f).label,
      })),
    [state.materialId]
  );

  // ── Setters ──
  const setMaterialId = useCallback((id: string) => {
    const finishes = getSheetMaterial(id)?.finishes ?? ['none'];
    setState((prev) => ({
      ...prev,
      materialId: id,
      finishType: finishes.includes(prev.finishType) ? prev.finishType : 'none',
    }));
  }, []);

  const setThicknessMm = useCallback((mm: number) => {
    setState((prev) => ({ ...prev, thicknessMm: mm }));
  }, []);

  const setFinishType = useCallback((type: FinishType) => {
    setState((prev) => ({ ...prev, finishType: type }));
  }, []);

  const setQuantity = useCallback((qty: number) => {
    const whole = Number.isFinite(qty) ? Math.round(qty) : 1;
    setState((prev) => ({ ...prev, quantity: Math.max(1, Math.min(10000, whole)) }));
  }, []);

  const setTurnaround = useCallback((type: TurnaroundType) => {
    setState((prev) => ({ ...prev, turnaround: type }));
  }, []);

  // ── Price locally — no network after the first analysis ──
  const { materialId, finishType, quantity, turnaround } = state;
  const request = useMemo<SheetQuoteRequest>(
    () => ({ materialId, thicknessMm, finishType, quantity, turnaround }),
    [materialId, thicknessMm, finishType, quantity, turnaround]
  );

  // Admin calibration scales the final price, exactly as the server does when saving
  const calibration = usePricingCalibration();
  const multiplier = resolveMultiplier(calibration, 'sheet', materialId);
  const shopLoad = calibration.shopLoad;
  const priced = useMemo(
    () => (enabled && analysis ? generateSheetQuote(analysis, request, shopLoad) : null),
    [enabled, analysis, request, shopLoad]
  );
  const quoteResult = useMemo(
    () => (priced?.success ? calibrateQuote(priced.data, multiplier) : null),
    [priced, multiplier]
  );

  const tierPricing = useMemo(
    () =>
      enabled && analysis
        ? calibrateTiers(getSheetTierTable(analysis, { ...request, quantity: 1 }, shopLoad), multiplier)
        : [],
    [enabled, analysis, request, multiplier, shopLoad]
  );

  const savingsPercent = useMemo(() => {
    const single = tierPricing[0]?.pricePerPart;
    if (!quoteResult || !single || quantity <= 1) return 0;
    return Math.max(0, Math.round((1 - quoteResult.pricePerPart / single) * 100));
  }, [tierPricing, quoteResult, quantity]);

  const error =
    analysisStatus === 'unsupported_file'
      ? 'Laser quotes need a STEP (.step, .stp) or DXF file.'
      : current && !current.success
        ? current.error.message
        : priced && !priced.success
          ? priced.error.message
          : null;

  return {
    state: { ...state, thicknessMm },
    request,
    setMaterialId,
    setThicknessMm,
    setFinishType,
    setQuantity,
    setTurnaround,
    materials,
    availableThicknesses,
    availableFinishes,
    turnaroundOptions: TURNAROUND_OPTIONS,
    analysisStatus,
    analysis,
    analysisId,
    quoteResult,
    dfmIssues: quoteResult?.dfmIssues ?? [],
    hasBlockingIssues: quoteResult?.hasBlockingIssues ?? false,
    error,
    errorCode: current && !current.success ? current.error.code : null,
    tierPricing,
    savingsPercent,
    retryAnalysis,
  };
}
