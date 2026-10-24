import type { AuthResult } from '@/lib/auth-middleware';
import { isVendorRole } from '@/lib/roles';
import {
  FileAccessRepository,
  type PartReference,
  type ProjectAccessInfo,
  type UploadRecord,
} from '@/repositories/file-access.repository';
import { Result, ok, err } from '@/utils/result';
import type { AppError } from '@/utils/errors';
import { logger } from '@/utils/logger';

// ═══════════════════════════════════════════════════
// FileAccessService — may this user read this stored file?
//
// Ownership comes from the server-written upload record, never from documents a
// customer can create. A project part only grants access when it was created by
// the file's uploader (so a forged part pointing at someone else's key is ignored).
// ═══════════════════════════════════════════════════

export type FileAccessReason =
  | 'admin'
  | 'uploader'
  | 'project_owner'
  | 'project_vendor'
  | 'artifact'
  | 'legacy_part'
  | 'denied';

export interface FileAccessDecision {
  readonly allowed: boolean;
  readonly reason: FileAccessReason;
}

const allow = (reason: FileAccessReason): FileAccessDecision => ({ allowed: true, reason });
const DENY: FileAccessDecision = { allowed: false, reason: 'denied' };

/** Files uploaded before upload records existed. Turn off after running the backfill script. */
function legacyFallbackEnabled(): boolean {
  return process.env.FILE_ACCESS_LEGACY_FALLBACK !== 'false';
}

function projectGrants(auth: AuthResult, project: ProjectAccessInfo | null): FileAccessReason | null {
  if (!project) return null;
  if (project.userId === auth.uid) return 'project_owner';
  if (
    isVendorRole(auth.role) &&
    (project.assignedVendorId === auth.uid ||
      (Array.isArray(project.shortlistedVendorIds) && project.shortlistedVendorIds.includes(auth.uid)))
  ) {
    return 'project_vendor';
  }
  return null;
}

async function accessThroughParts(
  auth: AuthResult,
  parts: readonly PartReference[],
  ownerId: string
): Promise<Result<FileAccessReason | null, AppError>> {
  // Only parts the file's owner created can share it.
  const ownersParts = parts.filter((p) => p.userId === ownerId && p.projectId);
  const seen = new Set<string>();
  for (const part of ownersParts) {
    const projectId = part.projectId as string;
    if (seen.has(projectId)) continue;
    seen.add(projectId);

    const project = await FileAccessRepository.getProject(projectId);
    if (!project.success) return err(project.error);
    // The project must belong to the same owner, or the part is just a pointer.
    if (project.data?.userId !== ownerId) continue;
    const reason = projectGrants(auth, project.data);
    if (reason) return ok(reason);
  }
  return ok(null);
}

async function accessThroughArtifacts(
  auth: AuthResult,
  record: UploadRecord
): Promise<Result<FileAccessReason | null, AppError>> {
  for (const projectId of record.projectIds ?? []) {
    const project = await FileAccessRepository.getProject(projectId);
    if (!project.success) return err(project.error);
    const attached = project.data?.artifacts?.some(
      (a) => a.fileKey === record.fileKey && a.uploadedBy === record.userId
    );
    if (attached && projectGrants(auth, project.data)) return ok('artifact');
  }
  return ok(null);
}

export const FileAccessService = {
  async authorize(auth: AuthResult, fileKey: string): Promise<Result<FileAccessDecision, AppError>> {
    if (auth.role === 'admin') return ok(allow('admin'));

    const record = await FileAccessRepository.getUploadRecord(fileKey);
    if (!record.success) return err(record.error);

    if (record.data) {
      if (record.data.userId === auth.uid) return ok(allow('uploader'));

      const viaArtifact = await accessThroughArtifacts(auth, record.data);
      if (!viaArtifact.success) return err(viaArtifact.error);
      if (viaArtifact.data) return ok(allow(viaArtifact.data));

      const parts = await FileAccessRepository.getPartsReferencing(fileKey);
      if (!parts.success) return err(parts.error);
      const viaParts = await accessThroughParts(auth, parts.data, record.data.userId);
      if (!viaParts.success) return err(viaParts.error);
      return ok(viaParts.data ? allow(viaParts.data) : DENY);
    }

    if (!legacyFallbackEnabled()) return ok(DENY);

    // Legacy file (no upload record): treat the earliest part that referenced the
    // key as the owner's. "Earliest" is Firestore's own create time — the part's
    // createdAt field is written by the browser, so a forged part could claim to be
    // older than the real one. A part forged later is never earliest.
    const parts = await FileAccessRepository.getPartsReferencing(fileKey);
    if (!parts.success) return err(parts.error);
    const earliest = [...parts.data]
      .filter((p) => p.userId && p.projectId && Number.isFinite(p.createdAtMs))
      .sort((a, b) => (a.createdAtMs as number) - (b.createdAtMs as number))[0];
    if (!earliest?.userId) return ok(DENY);

    let granted = earliest.userId === auth.uid;
    if (!granted) {
      const viaParts = await accessThroughParts(auth, [earliest], earliest.userId);
      if (!viaParts.success) return err(viaParts.error);
      granted = viaParts.data !== null;
    }
    if (!granted) return ok(DENY);

    logger.info({ event: 'FileAccess: legacy file access', fileKey, uid: auth.uid });
    return ok(allow('legacy_part'));
  },
};
