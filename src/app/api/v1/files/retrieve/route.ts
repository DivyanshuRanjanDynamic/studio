import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { authenticateRequest, forbiddenResponse } from '@/lib/auth-middleware';
import { logger } from '@/utils/logger';
import { s3Client, S3_BUCKET } from '@/lib/s3-client';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { isVendorRole } from '@/lib/roles';

/**
 * GET /api/v1/files/retrieve?fileKey=[key]
 * Proxy endpoint to retrieve private S3 files securely.
 * Bypasses client-side CORS issues by streaming from server-to-server.
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
    const fileKey = searchParams.get('fileKey');

    if (!fileKey) {
      return NextResponse.json({ error: 'Missing fileKey parameter' }, { status: 400 });
    }

    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }

    // 2. Authorize file access (owner/admin/authorized vendor only)
    const requesterSnap = await adminFirestore.collection('users').doc(auth.uid).get();
    const requesterRole = requesterSnap.data()?.role as string | undefined;
    const requesterIsAdmin = requesterRole === 'admin';

    let canAccess = requesterIsAdmin;

    // Direct metadata ownership path
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

    // Project-part ownership / assignment fallback path
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
      logger.warn({ event: 'API: Unauthorized file retrieval attempt', fileKey, authUid: auth.uid });
      return forbiddenResponse('You do not have access to this file');
    }

    // 2. Select bucket (consistent with download API)
    let bucket = process.env.AWS_S3_CAD_BUCKET || process.env.AWS_S3_BUCKET || S3_BUCKET;
    if (fileKey.startsWith('rfq-designs/') && process.env.AWS_S3_BUCKET) {
      bucket = process.env.AWS_S3_BUCKET;
    }

    // 3. Fetch from S3
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    const s3Response = await s3Client.send(command);

    if (!s3Response.Body) {
      throw new Error('Empty body from S3');
    }

    // 4. Stream response to client
    // We treat the S3 body as a readable stream
    return new Response(s3Response.Body as ReadableStream, {
      headers: {
        'Content-Type': s3Response.ContentType || 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `attachment; filename="${fileKey.split('/').pop()}"`,
      },
    });

  } catch (error: any) {
    logger.error({ event: 'API: Retrieval error', reqId, error: error.message });
    return NextResponse.json(
      { error: 'Failed to retrieve file from storage' },
      { status: 500 }
    );
  }
}
