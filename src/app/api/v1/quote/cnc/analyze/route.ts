import { NextRequest } from 'next/server';
import { QuoteController } from '@/controllers/quote.controller';

/**
 * POST /api/v1/quote/cnc/analyze — Converter analyses the caller's upload; result stored server-side
 */
export async function POST(request: NextRequest) {
  return QuoteController.analyzeCnc(request);
}
