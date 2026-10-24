import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { runVendorReminderCron } from '@/lib/cron/vendorReminderCron';
import { logger } from '@/utils/logger';

/** Constant-time check of the x-cron-secret header; no secret configured = nobody */
function isCronCaller(provided: string | null, secret: string | undefined): boolean {
  if (!secret || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  // Fails closed: without VENDOR_REMINDER_CRON_SECRET anyone could trigger the
  // reminder email blast to every pending vendor.
  const cronSecret = process.env.VENDOR_REMINDER_CRON_SECRET;
  if (!cronSecret) {
    logger.error({ event: 'Vendor reminder cron: VENDOR_REMINDER_CRON_SECRET is not set' });
    return NextResponse.json({ error: 'Cron not configured' }, { status: 503 });
  }
  if (!isCronCaller(req.headers.get('x-cron-secret'), cronSecret)) {
    return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
  }

  const result = await runVendorReminderCron();
  return NextResponse.json({ success: true, ...result });
}
