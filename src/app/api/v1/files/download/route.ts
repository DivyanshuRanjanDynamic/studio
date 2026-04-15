import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { getPresignedDownloadUrl } from '@/lib/s3-client';
import { logger } from '@/utils/logger';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { isVendorRole } from '@/lib/roles';

/**
 * GET /api/v1/files/download?key=[fileKey]
 * Generates a presigned URL for downloading a file.
 * Requires a valid Firebase ID Token in the Authorization header.
 */
export async function GET(req: NextRequest) {
  const reqId = Math.random().toString(36).substring(7);

  try {
    // 1. Authenticate the request
    const auth = await authenticateRequest(req);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const fileKey = searchParams.get('fileKey') || searchParams.get('key');

    if (!fileKey) {
      return NextResponse.json({ error: 'Missing fileKey parameter' }, { status: 400 });
    }

    // 2. Verify file access (owner/admin/authorized vendor only)
    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    const requesterSnap = await adminFirestore.collection('users').doc(auth.uid).get();
    const requesterRole = requesterSnap.data()?.role as string | undefined;
    const requesterIsAdmin = requesterRole === 'admin';

    let canAccess = requesterIsAdmin;

    if (!canAccess) {
      const filesSnapshot = await adminFirestore
        .collection('uploaded_files')
        .where('fileKey', '==', fileKey)
        .limit(1)
        .get();

      if (!filesSnapshot.empty) {
        const fileData = filesSnapshot.docs[0].data();
        if (fileData.userId === auth.uid) {
          canAccess = true;
        }
      }
    }

    if (!canAccess) {
      const partsSnapshot = await adminFirestore
        .collection('projectParts')
        .where('cadFile.fileUrl', '==', fileKey)
        .limit(20)
        .get();

      const projectCache = new Map<string, any>();
      for (const partDoc of partsSnapshot.docs) {
        const partData = partDoc.data() as { userId?: string; projectId?: string };

        if (partData.userId === auth.uid) {
          canAccess = true;
          break;
        }

        const projectId = partData.projectId;
        if (!projectId) continue;

        let projectData = projectCache.get(projectId);
        if (!projectData) {
          const projectSnap = await adminFirestore.collection('projectRFQs').doc(projectId).get();
          if (!projectSnap.exists) continue;
          projectData = projectSnap.data();
          projectCache.set(projectId, projectData);
        }

        if (projectData?.userId === auth.uid) {
          canAccess = true;
          break;
        }

        if (
          isVendorRole(requesterRole) &&
          (projectData?.assignedVendorId === auth.uid ||
            (Array.isArray(projectData?.shortlistedVendorIds) &&
              projectData.shortlistedVendorIds.includes(auth.uid)))
        ) {
          canAccess = true;
          break;
        }
      }
    }

    if (!canAccess) {
      logger.warn({ event: 'API: Unauthorized file download attempt', fileKey, authUid: auth.uid });
      return forbiddenResponse('You do not have access to this file');
    }

    // 3. Generate Presigned URL
    // Intelligently select bucket based on fileKey prefix
    let bucket = process.env.AWS_S3_CAD_BUCKET || process.env.AWS_S3_BUCKET || '';
    if (fileKey.startsWith('rfq-designs/') && process.env.AWS_S3_BUCKET) {
      bucket = process.env.AWS_S3_BUCKET;
    }

    const downloadUrl = await getPresignedDownloadUrl(fileKey, bucket);

    logger.info({ event: 'API: Presigned download URL generated', fileKey, bucket, reqId });

    return NextResponse.json({ url: downloadUrl, downloadUrl }); // Return both for compatibility
  } catch (error: any) {
    logger.error({ event: 'API: Download error', reqId, error: error.message });
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
