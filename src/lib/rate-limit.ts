import { createHash } from 'crypto';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { logger } from '@/utils/logger';

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

/** Firestore doc id for an identifier: readable prefix + hash (ids can't contain '/', must be short) */
function limitDocId(identifier: string): string {
  const prefix = identifier.split(':')[0].replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40) || 'rl';
  const hash = createHash('sha256').update(identifier).digest('hex').slice(0, 40);
  return `${prefix}_${hash}`;
}

/**
 * Firestore-based sliding-window rate limiter for serverless environments.
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
      const data: any = doc.data() || { requests: [], count: 0 };

      // Filter out old requests
      const validRequests: number[] = (data.requests || []).filter(
        (timestamp: number) => timestamp > now - windowMs
      );

      if (validRequests.length >= limit) {
        return { success: false, remaining: 0, reset: (validRequests[0] || now) + windowMs };
      }

      const newRequests = [...validRequests, now];
      transaction.set(limitRef, {
        requests: newRequests,
        count: newRequests.length,
        updatedAt: new Date().toISOString(),
      });

      return { success: true, remaining: limit - newRequests.length, reset: now + windowMs };
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
