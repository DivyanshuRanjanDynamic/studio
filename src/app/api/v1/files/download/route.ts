import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { getPresignedDownloadUrl } from '@/lib/s3-client';
import { authenticateRequest, forbiddenResponse, checkVerification } from '@/lib/auth-middleware';
import { FileAccessService } from '@/services/file-access.service';
import { bucketForFileKey } from '@/lib/file-buckets';

/**
 * GET /api/v1/files/download?key=[fileKey]
 * Returns a short-lived presigned URL for a file the caller may read
 * (uploader, project owner, the project's vendor, or admin — see FileAccessService).
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
    const fileKey = searchParams.get('fileKey') || searchParams.get('key');

    if (!fileKey) {
      return NextResponse.json({ error: 'Missing fileKey parameter' }, { status: 400 });
    }

    // 2. Authorize from server-recorded ownership
    const decision = await FileAccessService.authorize(auth, fileKey);
    if (!decision.success) {
      return NextResponse.json({ error: 'Could not check file access' }, { status: 503 });
    }
    if (!decision.data.allowed) {
      logger.warn({ event: 'API: Unauthorized file download attempt', fileKey, authUid: auth.uid });
      return forbiddenResponse('You do not have access to this file');
    }

    // 3. Short-lived presigned URL (5 minutes)
    const downloadUrl = await getPresignedDownloadUrl(fileKey, bucketForFileKey(fileKey), 300);

    logger.info({ event: 'API: Presigned download URL generated', fileKey, reason: decision.data.reason, reqId });

    return NextResponse.json(
      { url: downloadUrl, downloadUrl }, // Return both for compatibility
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error: any) {
    logger.error({ event: 'API: Download error', reqId, error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
