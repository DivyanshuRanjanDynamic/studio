import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';

/**
 * VENDOR LAYOUT GUARD
 * Performs strict server-side authentication and role verification for Vendors/MechMasters.
 */
export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;

  if (!session) {
    logger.debug({ event: 'VendorLayout: No session found, redirecting' });
    redirect('/login?redirect=/vendor');
  }

  const { adminAuth, adminFirestore } = getFirebaseAdmin();
  if (!adminAuth || !adminFirestore) {
    redirect('/login?error=service_unavailable');
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    const userDoc = await adminFirestore.collection('users').doc(decodedClaims.uid).get();
    const userData = userDoc.data();

    // Enforce Vendor/MechMaster roles
    const isVendor = userData?.role === 'vendor' || userData?.role === 'mechmaster';
    
    if (!isVendor) {
      logger.warn({ 
        event: 'VendorLayout: Access denied (unauthorized role)', 
        uid: decodedClaims.uid, 
        role: userData?.role 
      });
      redirect('/dashboard');
    }

    // Enforce active status
    if (userData?.status !== 'active') {
      redirect('/login?error=account_not_active');
    }

    return <>{children}</>;
  } catch (error: any) {
    if (error.message === 'NEXT_REDIRECT') throw error;
    logger.error({ event: 'VendorLayout: Auth verification failed', error: error.message });
    redirect('/login');
  }
}
