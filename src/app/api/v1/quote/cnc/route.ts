import { NextRequest } from 'next/server';
import { QuoteController } from '@/controllers/quote.controller';

/**
 * POST /api/v1/quote/cnc — Price and Save a CNC Quote from a stored analysis ({ analysisId, request })
 */
export async function POST(request: NextRequest) {
  return QuoteController.createCncQuote(request);
}
