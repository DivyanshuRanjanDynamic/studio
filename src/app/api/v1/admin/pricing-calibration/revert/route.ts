import { NextRequest } from 'next/server';
import { handleCalibrationChange } from '../change';

/** POST /api/v1/admin/pricing-calibration/revert — { key }, admins only */
export async function POST(req: NextRequest) {
  return handleCalibrationChange(req, 'revert');
}
