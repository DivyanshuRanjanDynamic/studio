export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { AdminController } from '@/controllers/admin.controller';

/**
 * DELETE /api/v1/admin/products/delete — Product Purge
 * Consolidates deletion of product metadata and storage assets.
 */
export async function DELETE(req: NextRequest) {
  return AdminController.deleteProduct(req);
}
