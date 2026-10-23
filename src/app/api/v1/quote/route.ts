import { NextRequest } from 'next/server';
import { QuoteController } from '@/controllers/quote.controller';

/**
 * POST /api/v1/quote — Price and Save a laser (sheet) quote from a stored analysis ({ analysisId, request })
 */
export async function POST(request: NextRequest) {
  return QuoteController.createQuote(request);
}
