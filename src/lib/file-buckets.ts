import { S3_BUCKET } from '@/lib/s3-client';

/**
 * Bucket holding a stored file. Legacy RFQ design uploads live in the general
 * bucket; everything else in the CAD bucket. Shared by download/retrieve/upload.
 */
export function bucketForFileKey(fileKey: string): string {
  if (fileKey.startsWith('rfq-designs/') && process.env.AWS_S3_BUCKET) {
    return process.env.AWS_S3_BUCKET;
  }
  return process.env.AWS_S3_CAD_BUCKET || process.env.AWS_S3_BUCKET || S3_BUCKET;
}
