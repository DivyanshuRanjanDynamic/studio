'use client';

// ═══════════════════════════════════════════════════
// use-cnc-quote — CNC branch of the instant quote
// One server-side analysis per file (cached by SHA-256), then every
// material / finish / quantity / turnaround change re-prices locally.
// The browser never calls the converter; quotes reference the stored analysisId.
// ═══════════════════════════════════════════════════

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type {
  CncAnalysis,
  CncQuoteRequest,
  CncQuoteResult,
  DFMIssue,
  FinishType,
  QuantityTier,
  QuoteProcessMode,
  TurnaroundType,
} from '@/types/quoting';
import { generateCncQuote, getCncTierTable } from '@/lib/quoting/pricing-engine';
import { findTappableHoleGroups, tapRequestsFromPicks, type TappableHoleGroup } from '@/lib/quoting/tapping';
import {
  getActiveMaterials,
  getAvailableFinishes,
  getFinishRate,
  TURNAROUND_OPTIONS,
} from '@/lib/quoting/materials';
import { getCncMaterialData } from '@/lib/quoting/cnc-materials';
import { analyzeCncPart, type CncAnalysisHandle } from '@/services/quoteApi.service';
import { calibrateQuote, calibrateTiers, resolveMultiplier } from '@/lib/quoting/pricing-calibration';
import { usePricingCalibration } from '@/hooks/use-pricing-calibration';
import type { Result } from '@/utils/result';
import type { AppError } from '@/utils/errors';

const CNC_EXTENSIONS = ['.step', '.stp'];

export interface CncQuoteState {
  materialId: string;
  finishType: FinishType;
  quantity: number;
  turnaround: TurnaroundType;
}

export type CncAnalysisStatus = 'idle' | 'unsupported_file' | 'analyzing' | 'ready' | 'error';

/** Thread picked for one analysed hole group (keyed by TappableHoleGroup.key) */
export type TapPicks = Readonly<Record<string, { readonly tapId: string; readonly count: number }>>;
const NO_PICKS: TapPicks = {};

export interface UseCncQuoteReturn {
  // State
  state: CncQuoteState;
  /** What is priced and saved: the options plus any threads */
  request: CncQuoteRequest;
  // Tapping
  tappableHoles: readonly TappableHoleGroup[];
  tapPicks: TapPicks;
  setTapPick: (groupKey: string, pick: { tapId: string; count: number } | null) => void;
  // Setters
  setMaterialId: (id: string) => void;
  setFinishType: (type: FinishType) => void;
  setQuantity: (qty: number) => void;
  setTurnaround: (type: TurnaroundType) => void;
  // Derived data
  materials: ReturnType<typeof getActiveMaterials>;
  availableFinishes: ReadonlyArray<{ type: FinishType; label: string }>;
  turnaroundOptions: typeof TURNAROUND_OPTIONS;
  // Analysis
  analysisStatus: CncAnalysisStatus;
  analysis: CncAnalysis | null;
  /** Server-stored analysis this quote is priced from (sent when saving) */
  analysisId: string | null;
  /** Customer picked milling but the part analyses as turned, or vice versa */
  processMismatch: boolean;
  // Quote result
  quoteResult: CncQuoteResult | null;
  dfmIssues: readonly DFMIssue[];
  hasBlockingIssues: boolean;
  error: string | null;
  // Tier pricing
  tierPricing: readonly QuantityTier[];
  savingsPercent: number;
  // Actions
  retryAnalysis: () => void;
}

export function isCncFileName(fileName: string): boolean {
  const ext = '.' + (fileName.split('.').pop()?.toLowerCase() ?? '');
  return CNC_EXTENSIONS.includes(ext);
}

interface AnalysisEntry {
  key: string;
  result: Result<CncAnalysisHandle, AppError>;
}

export function useCncQuote(
  file: File | null,
  fileKey: string | null,
  mode: QuoteProcessMode
): UseCncQuoteReturn {
  const materials = useMemo(
    () => getActiveMaterials().filter((m) => getCncMaterialData(m.id) !== undefined),
    []
  );

  const [state, setState] = useState<CncQuoteState>({
    materialId: materials.find((m) => m.id === 'al_6061')?.id ?? materials[0]?.id ?? '',
    finishType: 'none',
    quantity: 1,
    turnaround: 'standard_3d',
  });

  // In-flight and settled analyses, keyed by file hash. Sharing the promise
  // means re-renders, StrictMode re-runs and process toggles never re-upload.
  const analyses = useRef(new Map<string, Promise<Result<CncAnalysisHandle, AppError>>>());
  const [entry, setEntry] = useState<AnalysisEntry | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const isCncMode = mode !== 'laser';
  const fileSupported = file !== null && isCncFileName(file.name);
  const enabled = isCncMode && fileSupported && fileKey !== null;

  useEffect(() => {
    if (!enabled || !file || !fileKey) return;

    let cancelled = false;
    let pending = analyses.current.get(fileKey);
    if (!pending) {
      pending = analyzeCncPart(file);
      analyses.current.set(fileKey, pending);
    }
    const thisRequest = pending;
    thisRequest.then((result) => {
      // Forget failures so the next attempt calls the service again.
      if (!result.success && analyses.current.get(fileKey) === thisRequest) {
        analyses.current.delete(fileKey);
      }
      if (!cancelled) {
        setEntry({ key: fileKey, result });
      }
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

  const analysisStatus: CncAnalysisStatus = !isCncMode
    ? 'idle'
    : !file
      ? 'idle'
      : !fileSupported
        ? 'unsupported_file'
        : !current
          ? 'analyzing'
          : current.success
            ? 'ready'
            : 'error';

  // ── Derived filtered options ──
  const availableFinishes = useMemo(
    () =>
      getAvailableFinishes(state.materialId).map((f) => ({
        type: f,
        label: getFinishRate(f).label,
      })),
    [state.materialId]
  );

  // ── Setters ──
  const setMaterialId = useCallback((id: string) => {
    const finishes = getAvailableFinishes(id);
    setState((prev) => ({
      ...prev,
      materialId: id,
      finishType: finishes.includes(prev.finishType) ? prev.finishType : 'none',
    }));
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
  // The stock was sized for the recommended process (bar vs block), so the
  // quote always uses it; processMismatch lets the UI say so.
  const processMismatch =
    analysis !== null &&
    (analysis.process.recommended === 'cnc_turning') !== (mode === 'cnc_turning');

  // ── Tapping: picks belong to one analysis, so a new file starts clean ──
  const tappableHoles = useMemo(() => findTappableHoleGroups(analysis), [analysis]);
  const [tapState, setTapState] = useState<{ analysisId: string | null; picks: TapPicks }>({
    analysisId: null,
    picks: NO_PICKS,
  });
  const tapPicks = tapState.analysisId === analysisId ? tapState.picks : NO_PICKS;
  const setTapPick = useCallback(
    (groupKey: string, pick: { tapId: string; count: number } | null) => {
      setTapState((prev) => {
        const picks = { ...(prev.analysisId === analysisId ? prev.picks : NO_PICKS) };
        if (pick) picks[groupKey] = pick;
        else delete picks[groupKey];
        return { analysisId, picks };
      });
    },
    [analysisId]
  );
  const taps = useMemo(() => tapRequestsFromPicks(tapPicks), [tapPicks]);

  const request = useMemo<CncQuoteRequest>(
    () => ({ ...state, ...(taps.length > 0 ? { taps } : {}) }),
    [state, taps]
  );

  // Admin settings (shop load for rush surge, price corrections), exactly as the server applies them
  const calibration = usePricingCalibration();
  const shopLoad = calibration.shopLoad;
  const priced = useMemo(
    () => (enabled && analysis ? generateCncQuote(analysis, request, undefined, shopLoad) : null),
    [enabled, analysis, request, shopLoad]
  );

  const { materialId, finishType, turnaround } = state;
  const multiplier = resolveMultiplier(calibration, 'cnc', materialId);
  const quoteResult = useMemo(
    () => (priced?.success ? calibrateQuote(priced.data, multiplier) : null),
    [priced, multiplier]
  );

  const tierPricing = useMemo(
    () =>
      enabled && analysis
        ? calibrateTiers(
          getCncTierTable(analysis, {
            materialId,
            finishType,
            turnaround,
            quantity: 1,
            ...(taps.length > 0 ? { taps } : {}),
          }, undefined, shopLoad),
          multiplier
        )
        : [],
    [enabled, analysis, materialId, finishType, turnaround, taps, multiplier, shopLoad]
  );

  const savingsPercent = useMemo(() => {
    const single = tierPricing[0]?.pricePerPart;
    if (!quoteResult || !single || state.quantity <= 1) return 0;
    return Math.max(0, Math.round((1 - quoteResult.pricePerPart / single) * 100));
  }, [tierPricing, quoteResult, state.quantity]);

  const error =
    analysisStatus === 'unsupported_file'
      ? 'CNC quotes need a STEP file (.step or .stp).'
      : current && !current.success
        ? current.error.message
        : priced && !priced.success
          ? priced.error.message
          : null;

  return {
    state,
    request,
    tappableHoles,
    tapPicks,
    setTapPick,
    setMaterialId,
    setFinishType,
    setQuantity,
    setTurnaround,
    materials,
    availableFinishes,
    turnaroundOptions: TURNAROUND_OPTIONS,
    analysisStatus,
    analysis,
    analysisId,
    processMismatch,
    quoteResult,
    dfmIssues: quoteResult?.dfmIssues ?? analysis?.dfm ?? [],
    hasBlockingIssues:
      quoteResult?.hasBlockingIssues ?? analysis?.dfm.some((i) => i.blocking) ?? false,
    error,
    tierPricing,
    savingsPercent,
    retryAnalysis,
  };
}
