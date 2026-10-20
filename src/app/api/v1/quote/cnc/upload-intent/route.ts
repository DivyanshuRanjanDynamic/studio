import { NextRequest } from 'next/server';
import { QuoteController } from '@/controllers/quote.controller';

/**
 * POST /api/v1/quote/cnc/upload-intent — Presigned S3 upload for a STEP file (signed-in)
 */
export async function POST(request: NextRequest) {
  return QuoteController.createCncUploadIntent(request);
}
