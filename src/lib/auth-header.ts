import { getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// ═══════════════════════════════════════════════════
// auth-header — Bearer ID token for browser → API calls
// The session cookie lasts 5 days while the Firebase sign-in persists, so a
// signed-in user can hold a stale cookie; the API accepts either, and the ID
// token is always fresh.
// ═══════════════════════════════════════════════════

/** { Authorization: 'Bearer …' } for the signed-in user, or {} (server, tests, signed out) */
export async function bearerHeader(): Promise<Record<string, string>> {
  if (typeof window === 'undefined' || getApps().length === 0) return {};
  try {
    const token = await getAuth().currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
