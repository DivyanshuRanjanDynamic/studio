import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, authorizeRoles } from '@/lib/auth-middleware';
import { PricingCalibrationService } from '@/services/pricing-calibration.service';

/**
 * GET /api/v1/admin/pricing-calibration — admins only.
 * Compares every engineer-agreed unit price with the instant price the part
 * was added at, per service / material / batch size, with the multipliers in
 * force, what Apply would set, and the change log. See lib/quoting/pricing-calibration.ts.
 */
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth.success) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const roleBlock = authorizeRoles(auth, 'admin');
  if (roleBlock) return roleBlock;

  const report = await PricingCalibrationService.getReport();
  if (!report.success) {
    return NextResponse.json({ error: report.error.message }, { status: report.error.statusCode });
  }
  return NextResponse.json(report.data);
}
