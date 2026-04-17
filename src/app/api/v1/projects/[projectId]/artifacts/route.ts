import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest, forbiddenResponse, checkVerification, authorizeRoles, unauthorizedResponse } from '@/lib/auth-middleware';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { ProjectRepository } from '@/repositories/project.repository';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { ProjectArtifact } from '@/models/project.model';
import { normalizeWorkflowStatus } from '@/lib/project-workflow';

const ArtifactSchema = z.object({
  type: z.enum(['production_photo', 'qc_report', 'shipping_doc', 'final_photo']),
  fileKey: z.string().min(1),
  fileName: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) return unauthorizedResponse();

    const verifyBlock = checkVerification(auth);
    if (verifyBlock) return verifyBlock;

    const { projectId } = await params;
    const { adminFirestore } = getFirebaseAdmin();
    if (!adminFirestore) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });

    const projectResult = await ProjectRepository.getProjectRfqById(projectId);
    if (!projectResult.success) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const project = projectResult.data;

    const isAdmin = auth.role === 'admin';
    const isAssignedVendor = project.assignedVendorId === auth.uid;

    if (!isAdmin && !isAssignedVendor) {
      return forbiddenResponse('Only the assigned vendor or admin can upload artifacts');
    }

    const canonical = normalizeWorkflowStatus(project.workflowStatus, project.status);
    const validStates = ['IN_PRODUCTION', 'QUALITY_CHECK', 'DISPATCHED', 'DELIVERED'];
    if (canonical && !validStates.includes(canonical) && !isAdmin) {
      return forbiddenResponse(`Cannot upload artifacts in state: ${canonical}`);
    }

    const body = await req.json();
    const parsed = ArtifactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid artifact data', details: parsed.error.flatten() }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const artifact: ProjectArtifact = {
      id: `art_${nanoid(12)}`,
      projectId,
      type: parsed.data.type,
      fileKey: parsed.data.fileKey,
      fileName: parsed.data.fileName,
      uploadedBy: auth.uid,
      uploadedAt: nowIso,
      notes: parsed.data.notes,
    };

    const artifacts = project.artifacts || [];
    const timelineEvents = project.timelineEvents || [];

    timelineEvents.push({
      id: `evt_${nanoid(9)}`,
      type: 'ARTIFACT_UPLOADED',
      projectId: projectId,
      actorType: (isAdmin ? 'admin' : 'vendor') as any,
      actorId: auth.uid,
      content: `Uploaded ${parsed.data.type.replace('_', ' ')}: ${parsed.data.fileName}`,
      channel: 'internal' as const,
      timestamp: nowIso,
    });

    await ProjectRepository.saveProjectRfq({
      id: projectId,
      artifacts: [...artifacts, artifact],
      timelineEvents,
    });

    return NextResponse.json({ success: true, artifact });
  } catch (error: any) {
    logger.error({ event: 'API: POST Artifact failed', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.success) return unauthorizedResponse();

    const { projectId } = await params;
    
    // Auth check: Anyone with project access can see artifacts
    const projectResult = await ProjectRepository.getProjectRfqById(projectId);
    if (!projectResult.success) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const project = projectResult.data;

    // Check ownership/admin/assigned vendor
    const isAdmin = auth.role === 'admin';
    const isOwner = project.userId === auth.uid;
    const isVendor = project.assignedVendorId === auth.uid;

    if (!isAdmin && !isOwner && !isVendor) {
      return forbiddenResponse();
    }

    return NextResponse.json({ success: true, artifacts: project.artifacts || [] });
  } catch (error: any) {
    logger.error({ event: 'API: GET Artifacts failed', error: error.message });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
