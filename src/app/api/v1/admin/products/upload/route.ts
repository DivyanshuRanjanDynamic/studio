export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { AdminController } from '@/controllers/admin.controller';

/**
 * POST /api/v1/admin/products/upload — Product Image Upload
 * Handles file optimization and indexing.
 */
export async function POST(req: NextRequest) {
  return AdminController.uploadProductImage(req);
}
