import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { runVendorReminderCron } from '@/lib/cron/vendorReminderCron';
import { logger } from '@/utils/logger';

/**
 * Vendor reminder cron, every 48h (vercel.json → crons).
 *
 *   GET  — Vercel Cron: sends `Authorization: Bearer <CRON_SECRET>` by itself.
 *   POST — any other scheduler: `x-cron-secret: <secret>` (or the same Bearer header).
 *
 * The secret is CRON_SECRET (Vercel's name). Fails
 * closed: with neither set, nobody can trigger the reminder email blast to every
 * pending vendor.
 */

/** Constant-time comparison; no secret configured = nobody */
function matches(provided: string | null, secret: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    logger.error({ event: 'Vendor reminder cron: CRON_SECRET  is not set' });
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }

  const bearer = req.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1] ?? null;
  if (!matches(bearer, cronSecret) && !matches(req.headers.get('x-cron-secret'), cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
  }

  const result = await runVendorReminderCron();
  return NextResponse.json({ success: true, ...result });
}

export const dynamic = 'force-dynamic';
export const GET = handle;
export const POST = handle;
