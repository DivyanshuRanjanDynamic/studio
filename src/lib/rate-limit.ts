import { createHash } from 'crypto';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { FieldValue } from 'firebase-admin/firestore';

import type { Transaction } from 'firebase-admin/firestore';

export interface RateLimitOptions {
  /**
   * What to do when the limiter's store (Firestore) is unavailable.
   * 'deny' (default): refuse — for anything that costs money or sends mail
   * (Gemini, emails, public forms, sign-up). 'allow': let it through — only for
   * authenticated, payment- or login-critical paths where a Firestore blip must
   * not block a paying customer.
   */
  onStoreError?: 'deny' | 'allow';
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

// ─── C9 fix: fixed-window counter ────────────────────────────────────────────
// The old sliding-window stored every request timestamp as an array element.
// Under a sustained DDoS from one IP the array grew without bound, eventually
// hitting the 1 MiB Firestore document limit and creating heavy transaction
// retry storms as concurrent requests all contended on the same document.
//
// The new design stores only two fields:
//   count       – requests in the current window
//   windowStart – epoch-ms of when the current window opened
//
// This makes every transaction O(1) in both read size and write size, removes
// the document-size risk entirely, and reduces contention retries.
// ─────────────────────────────────────────────────────────────────────────────

/** Firestore doc id for an identifier: readable prefix + hash (ids can't contain '/', must be short) */
function limitDocId(identifier: string): string {
  const prefix = identifier.split(':')[0].replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'rl';
  const hash = createHash('sha256').update(identifier).digest('hex').slice(0, 40);
  return `${prefix}_${hash}`;
}

/**
 * Firestore-based **fixed-window** rate limiter for serverless environments.
 *
 * Each Firestore document holds only `{ count, windowStart, updatedAt }`.
 * A new window resets count to 1 automatically when `windowMs` has elapsed.
 *
 * Key on a user id when the caller is authenticated, otherwise on
 * getClientIdentifier() (never on raw X-Forwarded-For — the client controls it).
 */
export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60000,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const onStoreError = options.onStoreError ?? 'deny';
  const now = Date.now();
  const unavailable = (reason: string, error?: string): RateLimitResult => {
    logger.error({ event: 'rate_limit_store_unavailable', reason, error, identifier, onStoreError });
    return onStoreError === 'allow'
      ? { success: true, remaining: 0, reset: now + windowMs }
      : { success: false, remaining: 0, reset: now + Math.min(windowMs, 30_000) };
  };

  const { adminFirestore } = getFirebaseAdmin();
  if (!adminFirestore) return unavailable('Firestore Admin not initialized');

  const limitRef = adminFirestore.collection('rate_limits').doc(limitDocId(identifier));

  try {
    return await adminFirestore.runTransaction(async (transaction: Transaction) => {
      const doc = (await transaction.get(limitRef)) as any;
      const data: { count?: number; windowStart?: number } = doc.data() ?? {};

      const windowStart: number = data.windowStart ?? now;
      const inWindow = now - windowStart < windowMs;

      // Backward-compatibility for documents or test mocks using legacy `requests` timestamp array
      const legacyRequests = Array.isArray((data as any).requests)
        ? (data as any).requests.filter((ts: number) => typeof ts === 'number' && now - ts < windowMs)
        : null;

      // Count of requests in the active window (reset to 0 if window expired)
      const currentCount = legacyRequests !== null
        ? legacyRequests.length
        : (inWindow ? (data.count ?? 0) : 0);
      const windowResetAt = inWindow ? windowStart + windowMs : now + windowMs;

      if (currentCount >= limit) {
        // Do NOT write — avoids unnecessary transaction contention on rejected requests.
        return { success: false, remaining: 0, reset: windowResetAt };
      }

      const newCount = currentCount + 1;
      transaction.set(
        limitRef,
        {
          count: inWindow ? FieldValue.increment(1) : 1,
          windowStart: inWindow ? windowStart : now,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      return {
        success: true,
        remaining: limit - newCount,
        reset: windowResetAt,
      };
    });
  } catch (error) {
    return unavailable('transaction failed', (error as Error).message);
  }
}

export function rateLimitResponse(reset: number) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: {
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.max(1, Math.ceil((reset - Date.now()) / 1000)).toString(),
      },
    }
  );
}
