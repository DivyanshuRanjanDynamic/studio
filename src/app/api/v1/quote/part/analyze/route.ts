import { NextRequest } from 'next/server';
import { QuoteController } from '@/controllers/quote.controller';

/**
 * POST /api/v1/quote/part/analyze — { fileKey, kind: 'sheet' | 'print' }
 * The converter analyses the caller's wizard upload; the result is stored server-side.
 */
export async function POST(request: NextRequest) {
  return QuoteController.analyzePart(request);
}
