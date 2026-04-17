import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';

/**
 * DASHBOARD LAYOUT GUARD
 * Ensures users are authenticated and redirects them to their specialized
 * portal if they have non-customer roles (Admin/Vendor).
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    redirect('/login?redirect=/dashboard');
  }

  const { adminAuth, adminFirestore } = getFirebaseAdmin();
  if (!adminAuth || !adminFirestore) {
    redirect('/login?error=service_unavailable');
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminFirestore.collection('users').doc(decodedClaims.uid).get();
    const userData = userDoc.data();

    // 1. Enforce Verification
    // Although session-level blocks exist, this is a deep-defense check.
    if (!decodedClaims.email_verified && !userData?.emailVerified) {
      logger.warn({ event: 'DashboardLayout: Unverified user blocked', uid: decodedClaims.uid });
      redirect('/login?error=unverified');
    }

    // 2. Role-based Redirection (Portal Context)
    // If an admin or vendor lands on /dashboard, send them to their context.
    if (userData?.role === 'admin') {
      redirect('/admin');
    } else if (userData?.role === 'vendor' || userData?.role === 'mechmaster') {
      redirect('/vendor');
    }

    // 3. Status check
    if (userData?.status !== 'active' && userData?.role !== 'vendor_pending') {
       // Note: vendor_pending is allowed in dashboard to see their status
       if (userData?.status === 'suspended') {
         redirect('/login?error=account_not_active');
       }
    }

    return <>{children}</>;
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    logger.error({ event: 'DashboardLayout: Auth verification failed', error: error.message });
    redirect('/login');
  }
}
