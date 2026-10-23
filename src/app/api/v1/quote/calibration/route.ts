import { NextRequest } from 'next/server';
import { QuoteController } from '@/controllers/quote.controller';

/**
 * GET /api/v1/quote/calibration — the admin-applied price multipliers ({ multipliers }),
 * so the browser's live price matches the quote the server saves.
 */
export async function GET(request: NextRequest) {
  return QuoteController.getCalibration(request);
}
