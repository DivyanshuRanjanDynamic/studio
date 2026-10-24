import { UserRepository } from '@/repositories/user.repository';

// ═══════════════════════════════════════════════════
// project-contact — who project emails go to
//
// A project's own userEmail/userName are written by the customer's browser (and
// the deployed rules let them change), so they would let anyone route MechHub
// mail to an arbitrary address. Recipients come from the owner's account doc,
// users/{uid}, whose email only the server writes.
// ═══════════════════════════════════════════════════

export interface ProjectContact {
  readonly email: string;
  readonly name: string;
}

/** The project owner's account email and name, or null when there is none on file */
export async function projectOwnerContact(project: {
  readonly userId?: string | null;
  readonly userName?: string | null;
}): Promise<ProjectContact | null> {
  if (!project.userId) return null;
  const user = await UserRepository.getUserById(project.userId);
  if (!user.success) return null;
  const email = typeof user.data.email === 'string' ? user.data.email.trim() : '';
  if (!email) return null;
  return { email, name: user.data.fullName || project.userName || 'Customer' };
}
