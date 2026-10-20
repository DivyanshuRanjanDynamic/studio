import { createHash } from 'crypto';
import { resolve } from 'path';
import * as dotenv from 'dotenv';
import { getFirebaseAdmin } from '../src/lib/firebase-admin';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

/**
 * BACKFILL FILE OWNERS
 *
 * Files uploaded before upload-intent recorded ownership have no `uploaded_files`
 * record, so downloads fall back to "earliest part that references the key".
 * This writes the server records that fallback would infer:
 *   - CAD files: owner = userId of the earliest projectParts doc with cadFile.fileUrl == key
 *   - Artifacts: owner = artifact.uploadedBy, linked to its project
 * Keys that already have a server record are left alone.
 *
 * Usage:
 *   npx tsx scripts/backfill-file-owners.ts            # dry run — prints what it would write
 *   npx tsx scripts/backfill-file-owners.ts --apply    # writes the records
 *
 * After a successful --apply, set FILE_ACCESS_LEGACY_FALLBACK=false on the app.
 */

const apply = process.argv.includes('--apply');

interface Planned {
  fileId: string;
  fileKey: string;
  userId: string;
  fileName: string;
  kind: 'cad' | 'artifact';
  projectIds: string[];
}

const fileIdFor = (key: string) => `file_bf_${createHash('sha256').update(key).digest('hex').slice(0, 24)}`;

async function main() {
  const { adminFirestore: db } = getFirebaseAdmin();
  if (!db) {
    console.error('Failed to initialize Firebase Admin. Check your environment variables.');
    process.exit(1);
  }

  const existing = new Set<string>();
  (await db.collection('uploaded_files').where('source', '==', 'server').get()).forEach((d: any) =>
    existing.add(d.data().fileKey)
  );

  const planned = new Map<string, Planned>();

  // CAD files referenced by parts — earliest part wins
  const earliestPart = new Map<string, { userId: string; createdAt: string; fileName: string }>();
  (await db.collection('projectParts').get()).forEach((d: any) => {
    const part = d.data();
    const key = part?.cadFile?.fileUrl;
    if (typeof key !== 'string' || !key || !part.userId) return;
    const createdAt = part.createdAt ?? '';
    const prev = earliestPart.get(key);
    if (!prev || createdAt.localeCompare(prev.createdAt) < 0) {
      earliestPart.set(key, { userId: part.userId, createdAt, fileName: part.cadFile.fileName ?? '' });
    }
  });
  for (const [fileKey, owner] of earliestPart) {
    if (existing.has(fileKey)) continue;
    planned.set(fileKey, {
      fileId: fileIdFor(fileKey),
      fileKey,
      userId: owner.userId,
      fileName: owner.fileName,
      kind: 'cad',
      projectIds: [],
    });
  }

  // Artifacts attached to projects
  (await db.collection('projectRFQs').get()).forEach((d: any) => {
    for (const art of d.data()?.artifacts ?? []) {
      if (typeof art?.fileKey !== 'string' || !art.uploadedBy || existing.has(art.fileKey)) continue;
      const entry: Planned = planned.get(art.fileKey) ?? {
        fileId: fileIdFor(art.fileKey),
        fileKey: art.fileKey,
        userId: art.uploadedBy,
        fileName: art.fileName ?? '',
        kind: 'artifact',
        projectIds: [],
      };
      if (!entry.projectIds.includes(d.id)) entry.projectIds.push(d.id);
      planned.set(art.fileKey, entry);
    }
  });

  console.log(`${existing.size} keys already have server records; ${planned.size} to backfill.`);
  for (const p of planned.values()) {
    console.log(`  ${p.kind.padEnd(8)} ${p.fileKey} → ${p.userId}${p.projectIds.length ? ` (projects: ${p.projectIds.join(', ')})` : ''}`);
  }

  if (!apply) {
    console.log('\nDry run — nothing written. Re-run with --apply to write these records.');
    return;
  }

  const items = [...planned.values()];
  for (let i = 0; i < items.length; i += 400) {
    const batch = db.batch();
    for (const p of items.slice(i, i + 400)) {
      batch.set(db.collection('uploaded_files').doc(p.fileId), {
        fileId: p.fileId,
        fileKey: p.fileKey,
        userId: p.userId,
        fileName: p.fileName,
        fileSize: 0,
        kind: p.kind,
        ...(p.projectIds.length ? { projectIds: p.projectIds } : {}),
        source: 'server',
        backfilled: true,
        createdAt: new Date().toISOString(),
      });
    }
    await batch.commit();
  }
  console.log(`\nWrote ${items.length} records. You can now set FILE_ACCESS_LEGACY_FALLBACK=false.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
