'use client';

// ═══════════════════════════════════════════════════
// use-wizard-cnc-analysis — server-side CNC analysis of the part wizard's upload
// One analysis per uploaded file key (shared promise, so step changes and
// StrictMode never re-run it); failures are forgotten so Retry calls again.
// ═══════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CncAnalysis } from '@/types/quoting';
import { analyzeUploadedStep, type CncAnalysisHandle } from '@/services/quoteApi.service';
import type { Result } from '@/utils/result';
import type { AppError } from '@/utils/errors';

export type WizardAnalysisStatus = 'idle' | 'analyzing' | 'ready' | 'error';

export interface UseWizardCncAnalysisReturn {
  status: WizardAnalysisStatus;
  analysisId: string | null;
  analysis: CncAnalysis | null;
  error: string | null;
  retry: () => void;
}

const STEP_FILE = /\.(step|stp)$/i;

export function useWizardCncAnalysis(
  fileKey: string | null | undefined,
  fileName: string | null | undefined,
  enabled: boolean
): UseWizardCncAnalysisReturn {
  const inflight = useRef(new Map<string, Promise<Result<CncAnalysisHandle, AppError>>>());
  const [entry, setEntry] = useState<{ key: string; result: Result<CncAnalysisHandle, AppError> } | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const active = enabled && !!fileKey && !!fileName && STEP_FILE.test(fileName);

  useEffect(() => {
    if (!active || !fileKey || !fileName) return;
    let cancelled = false;

    let pending = inflight.current.get(fileKey);
    if (!pending) {
      pending = analyzeUploadedStep(fileKey, fileName);
      inflight.current.set(fileKey, pending);
    }
    const thisRequest = pending;
    thisRequest.then((result) => {
      if (!result.success && inflight.current.get(fileKey) === thisRequest) {
        inflight.current.delete(fileKey);
      }
      if (!cancelled) setEntry({ key: fileKey, result });
    });

    return () => {
      cancelled = true;
    };
  }, [active, fileKey, fileName, retryToken]);

  const retry = useCallback(() => {
    setEntry(null);
    setRetryToken((t) => t + 1);
  }, []);

  const current = active && entry && entry.key === fileKey ? entry.result : null;
  return {
    status: !active ? 'idle' : !current ? 'analyzing' : current.success ? 'ready' : 'error',
    analysisId: current?.success ? current.data.analysisId : null,
    analysis: current?.success ? current.data.analysis : null,
    error: current && !current.success ? current.error.message : null,
    retry,
  };
}
