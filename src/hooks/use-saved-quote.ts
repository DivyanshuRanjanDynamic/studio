'use client';

// ═══════════════════════════════════════════════════
// use-saved-quote — the server-priced quote behind the Review step
// Either saved from the current configuration or loaded from a ?ref= share link.
// ═══════════════════════════════════════════════════

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AnyQuoteResult } from '@/types/quoting';
import { fetchSharedQuote, saveQuote, type SaveQuoteInput } from '@/services/quoteApi.service';
import type { Result } from '@/utils/result';
import type { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

export type SavedQuoteStatus = 'idle' | 'saving' | 'loading' | 'ready' | 'error';

/** Re-use a saved quote for an unchanged config only if it has this long left */
const REUSE_MIN_REMAINING_MS = 60 * 1000;

export interface UseSavedQuoteReturn {
  quote: AnyQuoteResult | null;
  /** 'shared' when the quote came from a ?ref= link rather than this session */
  source: 'saved' | 'shared' | null;
  status: SavedQuoteStatus;
  error: string | null;
  /** The server rejected the request because nobody is signed in */
  needsSignIn: boolean;
  /** Saves the configured quote; `key` identifies the config so repeats are not re-saved */
  save: (key: string, input: SaveQuoteInput) => Promise<Result<AnyQuoteResult, AppError>>;
  retryShared: () => void;
  clear: () => void;
}

export function useSavedQuote(shareRef: string | null): UseSavedQuoteReturn {
  const [quote, setQuote] = useState<AnyQuoteResult | null>(null);
  const [source, setSource] = useState<'saved' | 'shared' | null>(null);
  const [status, setStatus] = useState<SavedQuoteStatus>(shareRef ? 'loading' : 'idle');
  const [error, setError] = useState<string | null>(null);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [retryToken, setRetryToken] = useState(0);
  const savedKey = useRef<string | null>(null);

  // ── Shared link: load once per ref ──
  useEffect(() => {
    if (!shareRef) return;

    let cancelled = false;
    setStatus('loading');
    setError(null);
    setNeedsSignIn(false);
    fetchSharedQuote(shareRef).then((result) => {
      if (cancelled) return;
      if (result.success) {
        savedKey.current = null;
        setQuote(result.data);
        setSource('shared');
        setStatus('ready');
      } else {
        logger.warn({ event: 'Shared quote load failed', ref: shareRef, code: result.error.code });
        setQuote(null);
        setSource(null);
        setStatus('error');
        setNeedsSignIn(result.error.statusCode === 401);
        setError(
          result.error.statusCode === 404
            ? `We couldn't find quote ${shareRef}. Check the link or start a new quote.`
            : result.error.message
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [shareRef, retryToken]);

  const save = useCallback(
    async (key: string, input: SaveQuoteInput): Promise<Result<AnyQuoteResult, AppError>> => {
      if (
        quote &&
        source === 'saved' &&
        savedKey.current === key &&
        quote.expiresAt - Date.now() > REUSE_MIN_REMAINING_MS
      ) {
        return { success: true, data: quote };
      }

      setStatus('saving');
      setError(null);
      setNeedsSignIn(false);
      const result = await saveQuote(input);
      if (result.success) {
        savedKey.current = key;
        setQuote(result.data);
        setSource('saved');
        setStatus('ready');
        logger.info({ event: 'Quote saved', quoteRef: result.data.quoteRef, kind: input.kind });
      } else {
        logger.warn({ event: 'Quote save failed', kind: input.kind, code: result.error.code });
        setStatus('error');
        setNeedsSignIn(result.error.statusCode === 401);
        setError(result.error.message);
      }
      return result;
    },
    [quote, source]
  );

  const retryShared = useCallback(() => setRetryToken((t) => t + 1), []);

  const clear = useCallback(() => {
    savedKey.current = null;
    setQuote(null);
    setSource(null);
    setStatus('idle');
    setError(null);
    setNeedsSignIn(false);
  }, []);

  return { quote, source, status, error, needsSignIn, save, retryShared, clear };
}
