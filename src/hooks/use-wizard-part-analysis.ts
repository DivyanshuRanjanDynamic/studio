'use client';

// ═══════════════════════════════════════════════════
// use-wizard-part-analysis — server-side sheet-metal / 3D-print analysis of the
// part wizard's upload. One analysis per (kind, file key), shared across step
// changes and StrictMode; failures are forgotten so Retry calls again.
// ═══════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PartAnalysisHandle } from '@/types/quoting';
import { analyzeUploadedPart } from '@/services/quoteApi.service';
import type { Result } from '@/utils/result';
import type { AppError, ErrorCode } from '@/utils/errors';
import type { WizardAnalysisStatus } from './use-wizard-cnc-analysis';

const FILE_TYPES: Readonly<Record<PartAnalysisHandle['kind'], RegExp>> = {
  sheet: /\.(step|stp)$/i,
  print: /\.(step|stp|stl|obj)$/i,
};

export interface UseWizardPartAnalysisReturn {
  status: WizardAnalysisStatus;
  analysisId: string | null;
  handle: PartAnalysisHandle | null;
  error: string | null;
  errorCode: ErrorCode | null;
  retry: () => void;
}

export function useWizardPartAnalysis(
  fileKey: string | null | undefined,
  fileName: string | null | undefined,
  kind: PartAnalysisHandle['kind'] | null
): UseWizardPartAnalysisReturn {
  const inflight = useRef(new Map<string, Promise<Result<PartAnalysisHandle, AppError>>>());
  const [entry, setEntry] = useState<{ key: string; result: Result<PartAnalysisHandle, AppError> } | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  const active = !!kind && !!fileKey && !!fileName && FILE_TYPES[kind].test(fileName);
  const key = active ? `${kind}:${fileKey}` : null;

  useEffect(() => {
    if (!active || !key || !kind || !fileKey || !fileName) return;
    let cancelled = false;

    let pending = inflight.current.get(key);
    if (!pending) {
      pending = analyzeUploadedPart(fileKey, fileName, kind);
      inflight.current.set(key, pending);
    }
    const thisRequest = pending;
    thisRequest.then((result) => {
      if (!result.success && inflight.current.get(key) === thisRequest) {
        inflight.current.delete(key);
      }
      if (!cancelled) setEntry({ key, result });
    });

    return () => {
      cancelled = true;
    };
  }, [active, key, kind, fileKey, fileName, retryToken]);

  const retry = useCallback(() => {
    setEntry(null);
    setRetryToken((t) => t + 1);
  }, []);

  const current = key && entry && entry.key === key ? entry.result : null;
  return {
    status: !active ? 'idle' : !current ? 'analyzing' : current.success ? 'ready' : 'error',
    analysisId: current?.success ? current.data.analysisId : null,
    handle: current?.success ? current.data : null,
    error: current && !current.success ? current.error.message : null,
    errorCode: current && !current.success ? current.error.code : null,
    retry,
  };
}
