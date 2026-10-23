import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, authorizeRoles } from '@/lib/auth-middleware';
import { PricingCalibrationService } from '@/services/pricing-calibration.service';

const bodySchema = z.object({ key: z.string().min(1).max(80) });

/**
 * Shared handler for POST …/apply and …/revert ({ key }): admins only. The
 * service re-checks every safety limit against stored data before changing prices.
 */
export async function handleCalibrationChange(req: NextRequest, action: 'apply' | 'revert') {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const roleBlock = authorizeRoles(auth, 'admin');
  if (roleBlock) return roleBlock;

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: 'Name the calibration group to change' }, { status: 400 });
  }

  const adminId = auth.email ?? auth.uid;
  const result =
    action === 'apply'
      ? await PricingCalibrationService.apply(body.data.key, adminId)
      : await PricingCalibrationService.revert(body.data.key, adminId);
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }
  return NextResponse.json({ change: result.data });
}
