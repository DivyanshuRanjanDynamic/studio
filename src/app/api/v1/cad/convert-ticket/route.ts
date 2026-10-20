import { NextRequest } from 'next/server';
import { CadController } from '@/controllers/cad.controller';

/**
 * POST /api/v1/cad/convert-ticket — Short-lived ticket for the converter's /convert (signed-in)
 */
export async function POST(request: NextRequest) {
  return CadController.createConvertTicket(request);
}
