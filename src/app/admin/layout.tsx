import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';

/**
 * ADMIN LAYOUT GUARD
 * Performs strict server-side authentication and role verification.
 * Prevents unauthorized users from seeing any pre-rendered admin content.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    logger.debug({ event: 'AdminLayout: No session found, redirecting' });
    redirect('/login?redirect=/admin');
  }

  const { adminAuth, adminFirestore } = getFirebaseAdmin();
  if (!adminAuth || !adminFirestore) {
    logger.error({ event: 'AdminLayout: Firebase Admin unavailable' });
    redirect('/login?error=service_unavailable');
  }

  try {
    // 1. Verify the session cookie (checks expiration and revocation)
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    
    // 2. Fetch the latest role/status from Firestore (Source of Truth)
    const userDoc = await adminFirestore.collection('users').doc(decodedClaims.uid).get();
    const userData = userDoc.data();

    // 3. Enforce Admin role
    if (userData?.role !== 'admin') {
      logger.warn({ 
        event: 'AdminLayout: Access denied (unauthorized role)', 
        uid: decodedClaims.uid, 
        role: userData?.role 
      });
      redirect('/dashboard'); // Send back to customer dashboard
    }

    // 4. Enforce active status
    if (userData?.status !== 'active') {
      logger.warn({ 
        event: 'AdminLayout: Access denied (account not active)', 
        uid: decodedClaims.uid,
        status: userData?.status
      });
      redirect('/login?error=account_not_active');
    }

    return <>{children}</>;
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    logger.error({ event: 'AdminLayout: Auth verification failed', error: error.message });
    redirect('/login');
  }
}
