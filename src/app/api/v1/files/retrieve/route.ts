import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { authenticateRequest, forbiddenResponse, checkVerification } from '@/lib/auth-middleware';
import { logger } from '@/utils/logger';
import { s3Client } from '@/lib/s3-client';
import { FileAccessService } from '@/services/file-access.service';
import { bucketForFileKey } from '@/lib/file-buckets';

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

    const verifyBlock = checkVerification(auth);
    if (verifyBlock) return verifyBlock;

    const { searchParams } = new URL(req.url);
    const fileKey = searchParams.get('fileKey');

    if (!fileKey) {
      return NextResponse.json({ error: 'Missing fileKey parameter' }, { status: 400 });
    }

    // 2. Authorize from server-recorded ownership
    const decision = await FileAccessService.authorize(auth, fileKey);
    if (!decision.success) {
      return NextResponse.json({ error: 'Could not check file access' }, { status: 503 });
    }
    if (!decision.data.allowed) {
      logger.warn({ event: 'API: Unauthorized file retrieval attempt', fileKey, authUid: auth.uid });
      return forbiddenResponse('You do not have access to this file');
    }

    // 3. Fetch from S3
    const s3Response = await s3Client.send(
      new GetObjectCommand({ Bucket: bucketForFileKey(fileKey), Key: fileKey })
    );

    if (!s3Response.Body) {
      throw new Error('Empty body from S3');
    }

    // 4. Stream to the client. Private: this URL is the same for every user, so a
    // shared cache (the CDN in front of App Hosting) must never store it.
    const safeName = (fileKey.split('/').pop() || 'file').replace(/[^A-Za-z0-9._-]/g, '_');
    return new Response(s3Response.Body as ReadableStream, {
      headers: {
        'Content-Type': s3Response.ContentType || 'application/octet-stream',
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: any) {
    logger.error({ event: 'API: Retrieval error', reqId, error: error.message });
    return NextResponse.json({ error: 'Failed to retrieve file from storage' }, { status: 500 });
  }
}
