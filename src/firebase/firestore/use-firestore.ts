'use client';

import { getFirestore, type Firestore } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase/provider';

/**
 * Firestore instance for the app. getFirestore() returns the same instance on
 * every call, so the result is stable for memo deps. Kept out of provider.tsx so
 * pages that never read data don't bundle the Firestore SDK.
 */
export function useFirestore(): Firestore {
  return getFirestore(useFirebaseApp());
}
