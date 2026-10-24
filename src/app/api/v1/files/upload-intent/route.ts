import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { s3Client } from '@/lib/s3-client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { authenticateRequest, checkVerification, authorizeRoles } from '@/lib/auth-middleware';
import { FileAccessRepository } from '@/repositories/file-access.repository';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';

// ═══════════════════════════════════════════════════
// POST /api/v1/files/upload-intent — Real S3 Presigned URL
// ═══════════════════════════════════════════════════

const CAD_EXTENSIONS = ['.dxf', '.step', '.stp', '.stl', '.obj'];
const ARTIFACT_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const MAX_CAD_SIZE = 30 * 1024 * 1024; // 30 MB
const MAX_ARTIFACT_SIZE = 10 * 1024 * 1024; // 10 MB
const UPLOADS_PER_HOUR = 60;

const ALLOWED_CONTENT_TYPES = new Set([
  'application/dxf',
  'application/octet-stream',
  'model/step',
  'model/stl',
  'model/obj',
  'application/sla',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

export async function POST(request: NextRequest) {
  const reqId = nanoid(8);
  logger.info({ event: 'API: POST /api/v1/files/upload-intent started', reqId });

  try {
    const auth = await authenticateRequest(request);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const verifyBlock = checkVerification(auth);
    if (verifyBlock) return verifyBlock;

    // Any verified user (customer, vendor, admin) can trigger upload intent for now
    // as it's needed for designs, artifacts, etc. Each URL can create a stored
    // object, so they're rate-limited per account.
    const limiter = await rateLimit(`upload-intent:${auth.uid}`, UPLOADS_PER_HOUR, 60 * 60 * 1000);
    if (!limiter.success) return rateLimitResponse(limiter.reset);

    const { fileName, fileSize, contentType } = await request.json().catch(() => ({}));

    if (typeof fileName !== 'string' || !fileName || typeof fileSize !== 'number' || !Number.isInteger(fileSize)) {
      return NextResponse.json({ error: 'Missing file metadata' }, { status: 400 });
    }

    const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    const isCad = CAD_EXTENSIONS.includes(ext);
    const isArtifact = ARTIFACT_EXTENSIONS.includes(ext);

    if (!isCad && !isArtifact) {
      logger.warn({ event: 'API: Invalid file extension rejected', fileName, reqId });
      return NextResponse.json({ error: `File type ${ext} not allowed` }, { status: 400 });
    }

    // Validate size
    const limit = isCad ? MAX_CAD_SIZE : MAX_ARTIFACT_SIZE;
    if (!Number.isFinite(fileSize) || fileSize <= 0 || fileSize > limit) {
      return NextResponse.json(
        { error: `File size exceeds limit for this file type (${limit / (1024 * 1024)}MB)` },
        { status: 400 }
      );
    }

    if (contentType && !ALLOWED_CONTENT_TYPES.has(contentType)) {
      logger.warn({ event: 'API: Invalid content type rejected', contentType, reqId });
      return NextResponse.json({ error: 'Invalid file content type' }, { status: 400 });
    }

    // 3. Generate unique S3 key
    const fileId = `file_${nanoid(12)}`;
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folder = isCad ? 'cad-files' : 'project-artifacts';
    const key = `${folder}/${nanoid(8)}/${sanitizedName}`;
    
    const bucket =
      process.env.AWS_S3_CAD_BUCKET || process.env.AWS_S3_BUCKET || 'mechhub-cad-files';

    // 4. Create Presigned PUT URL
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
      // Signed: S3 rejects a body of any other length, so the size limit above
      // holds for what is actually stored (the client's file.size is exact).
      ContentLength: fileSize,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); // 15 mins

    // 5. Record who owns this key. Downloads authorise from this record — never from
    //    documents a customer can create — so no record, no upload URL.
    const recorded = await FileAccessRepository.recordUpload({
      fileId,
      fileKey: key,
      userId: auth.uid,
      fileName: String(fileName).slice(0, 255),
      fileSize,
      kind: isCad ? 'cad' : 'artifact',
      source: 'server',
      createdAt: new Date().toISOString(),
    });
    if (!recorded.success) {
      return NextResponse.json({ error: 'Could not prepare the upload' }, { status: 503 });
    }

    logger.info({ event: 'API: Real S3 upload intent generated', fileId, key, isCad, reqId });

    return NextResponse.json({
      fileId,
      uploadUrl,
      fileKey: key,
      bucket,
      isCad,
      fields: {
        'Content-Type': contentType || 'application/octet-stream',
        Key: key,
      },
    });
  } catch (e) {
    logger.error({ event: 'API: Unexpected error in upload-intent route', reqId, error: e });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
