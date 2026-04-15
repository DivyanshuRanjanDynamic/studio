import { logger } from '@/utils/logger';

/**
 * getFirebaseAdmin — Safely initializes and returns the Firebase Admin SDK.
 * 
 * CRITICAL: This function uses dynamic require and window checks to ensure
 * that 'firebase-admin' is NEVER bundled into the client-side code.
 * Static imports of 'firebase-admin' cause build failures in Next.js/Turbopack.
 */
export function getFirebaseAdmin() {
  // 1. Browser Guard: Immediately return nulls if we're in the browser.
  if (typeof window !== 'undefined') {
    return {
      adminAuth: null,
      adminFirestore: null,
      adminStorage: null,
    };
  }

  try {
    // 2. Dynamic Require: Only load the heavy Node-only SDK on the server.
    // Using require here hides the dependency from some static analysis tools 
    // that would otherwise try to bundle it.
    const admin = require('firebase-admin');

    if (!admin.apps.length) {
      if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
      ) {
        let privateKey = process.env.FIREBASE_PRIVATE_KEY;

        // If user accidentally pasted the whole JSON file into the PRIVATE_KEY env var
        if (privateKey.startsWith('{')) {
          try {
            const parsed = JSON.parse(privateKey);
            if (parsed.private_key) {
              privateKey = parsed.private_key;
            }
          } catch (e) {
            logger.error({
              event: 'firebase_admin_key_parse_failed',
              error: 'Failed to parse FIREBASE_PRIVATE_KEY as JSON',
            });
          }
        }

        // Remove wrapping quotes often added by Vercel copy-pasting
        privateKey = privateKey.replace(/^["']|["']$/g, '');

        // Aggressive PEM Normalization to fix "DECODER routines" errors
        const beginStr = '-----BEGIN PRIVATE KEY-----';
        const endStr = '-----END PRIVATE KEY-----';

        if (privateKey.includes(beginStr) && privateKey.includes(endStr)) {
          let base64Part = privateKey.substring(
            privateKey.indexOf(beginStr) + beginStr.length,
            privateKey.indexOf(endStr)
          );

          // Remove all whitespace, literal \n, etc.
          base64Part = base64Part.replace(/\s+/g, '').replace(/\\n/g, '');

          // Re-chunk into 64-character lines (standard PEM format)
          const chunks = base64Part.match(/.{1,64}/g) || [];
          privateKey = `${beginStr}\n${chunks.join('\n')}\n${endStr}\n`;
        } else {
          // Fallback
          privateKey = privateKey.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
        
        logger.info({ event: 'firebase_admin_init_success' });
      } else {
        // Only warn on server where we expect these to be present
        logger.warn({
          event: 'firebase_admin_init_skipped',
          reason: 'Missing env vars',
        });
      }
    }

    return {
      adminAuth: admin.apps.length > 0 ? admin.auth() : null,
      adminFirestore: admin.apps.length > 0 ? admin.firestore() : null,
      adminStorage: admin.apps.length > 0 ? admin.storage() : null,
    };
  } catch (error) {
    logger.error({
      event: 'firebase_admin_init_failed',
      error: (error as Error).message,
    });
    return {
      adminAuth: null,
      adminFirestore: null,
      adminStorage: null,
    };
  }
}

