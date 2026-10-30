import { describe, it, expect, vi, beforeEach } from 'vitest';
import { legacyLaserQuote } from './__fixtures__/legacy-laser-quote';
import { ErrorCode } from '@/utils/errors';

// An in-memory stand-in for the Admin SDK — no Firestore project is contacted.
const store = new Map<string, Record<string, unknown>>();
const fakeAdminFirestore = {
  collection: (_name: string) => ({
    doc: (id: string) => ({
      set: async (data: Record<string, unknown>) => {
        store.set(id, data);
      },
      get: async () => ({ exists: store.has(id), data: () => store.get(id) }),
    }),
  }),
};
vi.mock('@/lib/firebase-admin', () => ({
  getFirebaseAdmin: () => ({ adminFirestore: fakeAdminFirestore }),
}));
vi.mock('@/firebase/db', () => ({ db: {} }));


describe('QuotesRepository (Admin SDK path)', () => {
  beforeEach(() => store.clear());

  it('round-trips a quote: same fields back, storage-only fields stripped', async () => {
    const { QuotesRepository } = await import('@/lib/firebase/repositories/quotes');
    const quote = legacyLaserQuote({ quoteRef: 'MH-ROUNDTRIP2' });

    const saved = await QuotesRepository.saveQuote(quote, 'user_1');
    expect(saved.success).toBe(true);
    expect(store.get('MH-ROUNDTRIP2')).toMatchObject({ status: 'active', userId: 'user_1' });

    const loaded = await QuotesRepository.getQuoteByRef('MH-ROUNDTRIP2');
    expect(loaded.success).toBe(true);
    if (!loaded.success) return;
    expect(loaded.data).toEqual({ ...JSON.parse(JSON.stringify(quote)), userId: 'user_1' });
  });

  it('reads Firestore Timestamp expiries as epoch millis', async () => {
    const { QuotesRepository } = await import('@/lib/firebase/repositories/quotes');
    store.set('MH-TIMESTAMP2', {
      quoteRef: 'MH-TIMESTAMP2',
      totalPrice: 100,
      expiresAt: { toMillis: () => 1_700_000_000_000 },
    });

    const loaded = await QuotesRepository.getQuoteByRef('MH-TIMESTAMP2');
    expect(loaded.success && loaded.data.expiresAt).toBe(1_700_000_000_000);
    expect(loaded.success && loaded.data.userId).toBeNull();
  });

  it('returns NOT_FOUND for unknown refs', async () => {
    const { QuotesRepository } = await import('@/lib/firebase/repositories/quotes');
    const loaded = await QuotesRepository.getQuoteByRef('MH-NOSUCHREF2');
    expect(loaded.success === false && loaded.error.code).toBe(ErrorCode.NOT_FOUND);
  });
});
