import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { getFirebaseAdmin } from '../src/lib/firebase-admin';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

/**
 * EXPIRE LEGACY UNPAID ORDERS
 *
 * Orders created before checkout stored `razorpayOrderId` can't be bound to a
 * payment, so the verify routes and the Razorpay webhook now refuse to mark them
 * paid (audit finding H3 — any signed payment used to be accepted for them).
 * This lists those unpaid orders and, with --apply, marks them expired so the
 * customer re-checks out from a fresh quote. Paid orders are never touched.
 *
 * Usage:
 *   npx tsx scripts/expire-legacy-unpaid-orders.ts            # dry run — lists the orders
 *   npx tsx scripts/expire-legacy-unpaid-orders.ts --apply    # marks them expired
 *
 * Check the Razorpay dashboard first: a listed order that was in fact paid must be
 * reconciled by hand (its payment id recorded) instead of expired.
 */

const apply = process.argv.includes('--apply');
const UNPAID = ['pending', 'unpaid', 'failed', 'processing', undefined, null];

async function main() {
  const { adminFirestore: db } = getFirebaseAdmin();
  if (!db) {
    console.error('Failed to initialize Firebase Admin. Check your environment variables.');
    process.exit(1);
  }

  const legacy: Array<{ id: string; userId: string; total: unknown; createdAt: string }> = [];
  (await db.collection('orders').get()).forEach((d: any) => {
    const order = d.data();
    if (order.razorpayOrderId || !UNPAID.includes(order.paymentStatus)) return;
    legacy.push({
      id: d.id,
      userId: order.userId ?? '?',
      total: order.total ?? order.pricing?.total ?? '?',
      createdAt: order.createdAt ?? '?',
    });
  });

  console.log(`${legacy.length} unpaid order(s) without a razorpayOrderId:`);
  for (const o of legacy) console.log(`  ${o.id}  user=${o.userId}  total=${o.total}  created=${o.createdAt}`);

  if (!apply) {
    console.log('\nDry run. Re-run with --apply to mark them expired.');
    return;
  }

  const now = new Date().toISOString();
  for (let i = 0; i < legacy.length; i += 400) {
    const batch = db.batch();
    for (const o of legacy.slice(i, i + 400)) {
      batch.update(db.collection('orders').doc(o.id), {
        status: 'expired',
        paymentStatus: 'failed',
        expiredReason: 'legacy_order_without_razorpay_order_id',
        updatedAt: now,
      });
    }
    await batch.commit();
  }
  console.log(`\nMarked ${legacy.length} order(s) expired.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
