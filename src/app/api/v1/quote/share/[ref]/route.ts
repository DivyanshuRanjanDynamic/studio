import { NextRequest } from 'next/server';
import { QuoteController } from '@/controllers/quote.controller';

/**
 * GET /api/v1/quote/share/[ref] — Retrieve Shared Quote
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  return QuoteController.getSharedQuote(request, ref);
}
