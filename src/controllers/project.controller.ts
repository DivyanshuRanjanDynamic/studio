import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ProjectService } from '@/services/project.service';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { getClientIdentifier } from '@/lib/auth-safety';
import { logger } from '@/utils/logger';
import { authenticateRequest } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

const DesignFileSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().max(10 * 1024 * 1024), // 10MB limit per file
  type: z.string().optional(),
  dataUrl: z
    .string()
    .startsWith('data:')
    .max(15 * 1024 * 1024), // DataURL size limit
});

const RfqSchema = z.object({
  userName: z.string().min(1).max(100),
  userEmail: z.string().email(),
  userPhone: z.string().max(20).optional(),
  teamName: z.string().max(100).optional(),
  projectName: z.string().min(1).max(200),
  manufacturingProcess: z.string().max(500),
  material: z.string().max(200),
  thickness: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  quantity: z.number().min(1),
  surfaceFinish: z.string().max(200).optional(),
  tolerance: z.string().max(100),
  deliveryDate: z.string().optional(),
  budgetRange: z.string().max(100).optional(),
  deliveryLocation: z.string().min(1).max(500),
  extraRequirements: z.string().max(2000).optional(),
  designFiles: z.array(DesignFileSchema).max(5),
  selectedVendorIds: z.array(z.string()).min(1).max(20),
  /**
   * BUG-4 fix: optional idempotency key. The client generates a UUID on page-load
   * and reuses it for the same form submission. A double-click or slow-network retry
   * returns the original rfqId without creating a duplicate RFQ.
   */
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/).optional(),
});

/**
 * ProjectController handles requests related to innovation projects and custom RFQs.
 */
export const ProjectController = {
  /**
   * Submits a custom manufacturing RFQ.
   */
  async submitRfq(request: Request) {
    try {
      // 1. Rate Limiting
      const ip = getClientIdentifier(request.headers);
      const limiter = await rateLimit(`rfq-submit:${ip}`, 3, 60000);
      if (!limiter.success) {
        return rateLimitResponse(limiter.reset);
      }

      // 2. Authenticate the request (optional - allows anonymous submissions)
      const auth = await authenticateRequest(request as any);
      
      // 3. Auth & Validation
      const body = await request.json();
      const result = RfqSchema.safeParse(body);

      if (!result.success) {
        logger.warn({ event: 'API: RFQ validation failed', errors: result.error.format() });
        return NextResponse.json(
          {
            error: 'Invalid submission data',
            details: result.error.format(),
          },
          { status: 400 }
        );
      }

      const data = result.data as any;

      // 4. Security: Set userId based on authentication status
      // If authenticated, use the verified uid; otherwise allow anonymous (null)
      if (auth.success) {
        data.userId = auth.uid;
      } else {
        // For anonymous submissions, set userId to null
        data.userId = null;
      }

      // 5. Security Checks for Files
      const allowedExtensions = [
        '.step',
        '.stp',
        '.stl',
        '.obj',
        '.pdf',
        '.zip',
        '.png',
        '.jpg',
        '.jpeg',
      ];
      for (const file of data.designFiles) {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
          return NextResponse.json({ error: `File type not allowed: ${ext}` }, { status: 400 });
        }
      }

      // ── BUG-4 fix: idempotency guard — prevents duplicate RFQs on double-click or
      // slow-network retry. Same pattern as shop-checkout and order/create.
      const idempotencyKey = result.data.idempotencyKey;
      if (idempotencyKey) {
        const { adminFirestore: db } = getFirebaseAdmin();
        if (db) {
          const idemRef = db.collection('idempotency_keys').doc(`rfq_${idempotencyKey}`);
          const existing = await db.runTransaction(async (tx: any) => {
            const snap = await tx.get(idemRef);
            if (snap.exists) return snap.data() as { rfqId?: string };
            tx.set(idemRef, { userId: data.userId, status: 'processing', createdAt: new Date().toISOString() });
            return null;
          });
          if (existing?.rfqId) {
            logger.info({ event: 'API: Returning cached idempotent RFQ', rfqId: existing.rfqId });
            return NextResponse.json({ success: true, rfqId: existing.rfqId });
          }
        }
      }

      // 6. Execution via Service
      const rfqResult = await ProjectService.submitProjectRfq(data);
      if (!rfqResult.success) {
        return NextResponse.json(
          { error: rfqResult.error?.message || 'Failed to submit RFQ' },
          { status: 500 }
        );
      }
      const rfqId = rfqResult.data;

      if (idempotencyKey) {
        const { adminFirestore: db } = getFirebaseAdmin();
        db?.collection('idempotency_keys')
          .doc(`rfq_${idempotencyKey}`)
          .update({ status: 'completed', rfqId, completedAt: new Date().toISOString() })
          .catch(() => {});
      }

      return NextResponse.json({ success: true, rfqId });
    } catch (error: any) {
      logger.error({
        event: 'API: RFQ submission failed',
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to submit RFQ. Please try again later.' },
        { status: 500 }
      );
    }
  },
};
