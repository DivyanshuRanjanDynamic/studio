/**
 * Checks if a user has administrative privileges based on Firebase Custom Claims.
 * This is the secure, recommended way to handle roles.
 * 
 * @param claims The decoded ID token claims from Firebase Admin or ID Token Result from Client
 * @returns boolean
 */
export function checkIsAdmin(claims: any): boolean {
  return !!claims?.admin;
}

/**
 * @deprecated INSECURE — Do NOT use this for access control decisions.
 *
 * Email-based admin checks are bypassable because Firebase Auth does not
 * guarantee that the email claim in a token matches the actual verified email
 * in all flows. Use `checkIsAdmin()` (custom claims) instead.
 *
 * This function is retained ONLY for initial onboarding scripts that run
 * server-side via Firebase Admin SDK (e.g., auth/verify/route.ts) where
 * the email is sourced directly from the Admin SDK's getUser() call.
 *
 * NEVER use this to gate UI access or API authorization.
 */
export const ADMIN_EMAILS = [
  'divyanshu.work914214@gmail.com',
  'outreach@mechhub.in',
  'admin@mechhub.in',
  'ap.raamachandiran@gmail.com'
];

/** @deprecated See ADMIN_EMAILS deprecation notice above. */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
