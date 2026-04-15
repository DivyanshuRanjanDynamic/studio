export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { AdminController } from '@/controllers/admin.controller';

/**
 * DELETE /api/v1/admin/products/upload/delete — Image Cleanup
 * Purges specific variant image.
 */
export async function DELETE(req: NextRequest) {
  return AdminController.deleteProductImage(req);
}
