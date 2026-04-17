import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { logger } from '@/utils/logger';
import { UserRole } from '@/models/user.model';

export interface AuthResult {
  success: true;
  uid: string;
  email?: string;
  emailVerified?: boolean;
  role: UserRole;
  status: string;
}

export interface AuthError {
  success: false;
  error: string;
  status: number;
}

export type AuthResponse = AuthResult | AuthError;

/**
 * Authenticates a request using either:
 * 1. Session cookie (session cookie in cookies)
 * 2. Bearer token (Authorization header with Firebase ID token)
 * 
 * Returns the authenticated user's uid, role, and verification status.
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResponse> {
  const { adminAuth, adminFirestore } = getFirebaseAdmin();

  if (!adminAuth || !adminFirestore) {
    return { success: false, error: 'Auth service unavailable', status: 500 };
  }

  let decodedClaims: any;
  let authMethod: 'cookie' | 'bearer' | null = null;

  // 1. Try session cookie first
  const sessionCookie = req.cookies.get('session')?.value;
  if (sessionCookie) {
    try {
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      authMethod = 'cookie';
    } catch (error: any) {
      logger.debug({ event: 'Session cookie invalid, falling back', error: error.message });
    }
  }

  // 2. Try Bearer token if session cookie failed or is missing
  if (!authMethod) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      try {
        decodedClaims = await adminAuth.verifyIdToken(idToken, true);
        authMethod = 'bearer';
      } catch (error: any) {
        logger.warn({ event: 'Bearer token verification failed', error: error.message });
        return { success: false, error: 'Invalid or expired token', status: 401 };
      }
    }
  }

  if (!authMethod || !decodedClaims) {
    return { success: false, error: 'Authentication required', status: 401 };
  }

  // 3. Resolve Role & Status from Firestore (Source of Truth)
  try {
    const userDoc = await adminFirestore.collection('users').doc(decodedClaims.uid).get();
    const userData = userDoc.data();

    return {
      success: true,
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      emailVerified: decodedClaims.email_verified || userData?.emailVerified || false,
      role: (userData?.role as UserRole) || 'customer',
      status: userData?.status || 'active',
    };
  } catch (error: any) {
    logger.error({ event: 'Firestore user data resolution failed', uid: decodedClaims.uid, error: error.message });
    return { success: false, error: 'Operational error resolving user profile', status: 500 };
  }
}

/**
 * Middleware helper to block unverified users. 
 * Should be called after authenticateRequest.
 */
export function checkVerification(auth: AuthResult): NextResponse | null {
  if (!auth.emailVerified) {
    return NextResponse.json(
      { error: 'Email verification required', code: 'UNVERIFIED' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Middleware helper to authorize specific roles.
 * Should be called after authenticateRequest.
 */
export function authorizeRoles(auth: AuthResult, ...allowedRoles: UserRole[]): NextResponse | null {
  if (!allowedRoles.includes(auth.role)) {
    logger.warn({ 
      event: 'Access denied: unauthorized role', 
      uid: auth.uid, 
      userRole: auth.role, 
      requiredRoles: allowedRoles 
    });
    return forbiddenResponse(`Access denied. Allowed roles: ${allowedRoles.join(' or ')}`);
  }
  return null;
}

/**
 * Helper to create a standardized unauthorized response
 */
export function unauthorizedResponse(message = 'Authentication required'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Helper to create a standardized forbidden response
 */
export function forbiddenResponse(message = 'Access denied'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 });
}

