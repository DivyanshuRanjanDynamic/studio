'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';

// Firestore is deliberately not created here: this runs on every page, and the
// Firestore SDK is the largest part of the bundle. Components that read data get
// it through useFirestore() (firestore/use-firestore.ts), so only they bundle it.
export function initializeFirebase() {
  if (getApps().length === 0) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
  };
}
