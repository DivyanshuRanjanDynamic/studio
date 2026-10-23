import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, authorizeRoles } from '@/lib/auth-middleware';
import { PricingCalibrationService } from '@/services/pricing-calibration.service';

const bodySchema = z.object({ percent: z.number().int().min(0).max(100) });

/**
 * POST /api/v1/admin/pricing-calibration/shop-load — { percent: 0–100 }, admins only.
 * Sets how busy the shop is; Rush and Same-day quotes surge above 85%.
 */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const roleBlock = authorizeRoles(auth, 'admin');
  if (roleBlock) return roleBlock;

  const body = bodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: 'Shop load must be a whole percentage from 0 to 100' }, { status: 400 });
  }

  const result = await PricingCalibrationService.setShopLoad(body.data.percent / 100, auth.email ?? auth.uid);
  if (!result.success) {
    return NextResponse.json({ error: result.error.message }, { status: result.error.statusCode });
  }
  return NextResponse.json({ change: result.data });
}
