import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { MediaService } from '@/services/media.service';
import { authenticateRequest } from '@/lib/auth-middleware';

/**
 * AdminController handles administrative API requests, primarily for product and asset management.
 */
export const AdminController = {
  /**
   * Authorizes the request as an admin.
   */
  async authorizeAdmin(req: NextRequest) {
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return { authorized: false as const, status: authResult.status, message: authResult.error };
    }

    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) {
      return { authorized: false as const, status: 500, message: 'Firebase Firestore not initialized' };
    }

    // Verify admin role server-side (supports both session-cookie and Bearer token flows)
    const userDoc = await adminFirestore.collection('users').doc(authResult.uid).get();
    if (userDoc.data()?.role !== 'admin') {
      return { authorized: false as const, status: 403, message: 'Forbidden' };
    }

    return { authorized: true as const, adminFirestore };
  },

  /**
   * Purges a product and all its associated cloud assets.
   */
  async deleteProduct(req: NextRequest) {
    let currentProductId = 'unknown';
    try {
      const auth = await this.authorizeAdmin(req);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.message }, { status: auth.status });
      }

      const { productId } = await req.json();
      currentProductId = productId;

      if (!productId) {
        return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
      }

      const mediaService = new MediaService(auth.adminFirestore!);
      await mediaService.deleteAllProductAssets(productId);

      return NextResponse.json({
        success: true,
        message: 'Product and assets purged successfully',
      });
    } catch (error: any) {
      logger.error({
        event: 'API: Product purge failed',
        error: error.message,
        productId: currentProductId,
      });
      return NextResponse.json(
        {
          error: error.message || 'Internal Server Error',
        },
        { status: 500 }
      );
    }
  },

  /**
   * Handles multi-size product image processing and upload.
   */
  async uploadProductImage(req: NextRequest) {
    try {
      const auth = await this.authorizeAdmin(req);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.message }, { status: auth.status });
      }

      const formData = await req.formData();
      const file = formData.get('file') as File;
      const productId = formData.get('productId') as string;
      const productName = formData.get('productName') as string;
      const sku = formData.get('sku') as string;
      const type = (formData.get('type') as string) || 'main';

      if (!file || !productId || !productName || !sku) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const mediaService = new MediaService(auth.adminFirestore!);

      const result = await mediaService.processAndUploadProductImage(buffer, {
        productId,
        productName,
        sku,
        type,
      });

      return NextResponse.json({
        success: true,
        image: result,
      });
    } catch (error: any) {
      logger.error({ event: 'API: Product image upload failed', error: error.message });
      return NextResponse.json(
        { error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  },

  /**
   * Deletes a specific product variant image from cloud storage.
   */
  async deleteProductImage(req: NextRequest) {
    try {
      const auth = await this.authorizeAdmin(req);
      if (!auth.authorized) {
        return NextResponse.json({ error: auth.message }, { status: auth.status });
      }

      const { productId, imageId, urls } = await req.json();

      if (!productId || !imageId || !urls) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const mediaService = new MediaService(auth.adminFirestore!);
      await mediaService.deleteProductImage(productId, imageId, urls);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      logger.error({ event: 'API: Product image deletion failed', error: error.message });
      return NextResponse.json(
        { error: error.message || 'Internal Server Error' },
        { status: 500 }
      );
    }
  },
};
