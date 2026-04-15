import { NextRequest, NextResponse } from 'next/server';
import { runVendorReminderCron } from '@/lib/cron/vendorReminderCron';

export async function POST(req: NextRequest) {
  const cronSecret = process.env.VENDOR_REMINDER_CRON_SECRET;
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret');
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }
  }

  const result = await runVendorReminderCron();
  return NextResponse.json({ success: true, ...result });
}
