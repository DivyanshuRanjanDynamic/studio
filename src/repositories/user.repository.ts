import { db } from '@/firebase/config';
import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, notFoundError } from '@/utils/errors';
import { User, UserRole } from '@/models/user.model';
import { logger } from '@/utils/logger';

const COLLECTION_NAME = 'users';

/**
 * UserRepository handles specialized Firestore operations for User documents.
 */
export const UserRepository = {
  /**
   * Retrieves a user by their UID.
   */
  async getUserById(id: string): Promise<Result<User, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();

      if (adminFirestore) {
        const userDoc = await adminFirestore.collection(COLLECTION_NAME).doc(id).get();
        if (!userDoc.exists) return err(notFoundError('User', id));
        return ok({ id: userDoc.id, ...userDoc.data() } as User);
      }

      // Client-side fallback (only used in browser environments if configured)
      const { getDoc, doc } = await import('firebase/firestore');
      const userSnap = await getDoc(doc(db, COLLECTION_NAME, id));
      if (!userSnap.exists()) return err(notFoundError('User', id));
      return ok({ id: userSnap.id, ...userSnap.data() } as User);
    } catch (e: any) {
      logger.error({ event: 'UserRepository: Failed to fetch user', error: e.message, id });
      return err(internalError('Database error while fetching user'));
    }
  },

  /**
   * Retrieves a user by their email address.
   */
  async getUserByEmail(email: string): Promise<Result<User, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();

      if (adminFirestore) {
        const querySnapshot = await adminFirestore.collection(COLLECTION_NAME).where('email', '==', email).limit(1).get();
        if (querySnapshot.empty) return err(notFoundError('User with email', email));
        const userDoc = querySnapshot.docs[0];
        return ok({ id: userDoc.id, ...userDoc.data() } as User);
      }

      const { query, collection, where, getDocs, limit } = await import('firebase/firestore');
      const q = query(collection(db, COLLECTION_NAME), where('email', '==', email), limit(1));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return err(notFoundError('User with email', email));
      const userDoc = snapshot.docs[0];
      return ok({ id: userDoc.id, ...userDoc.data() } as User);
    } catch (e: any) {
      logger.error({ event: 'UserRepository: Failed to fetch user by email', error: e.message, email });
      return err(internalError('Database error while fetching user by email'));
    }
  },

  /**
   * Creates or updates a user document.
   */
  async saveUser(user: Partial<User> & { id: string }): Promise<Result<void, AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();
      const timestamp = new Date().toISOString();
      const userData = {
        ...user,
        updatedAt: timestamp,
      };

      if (adminFirestore) {
        await adminFirestore.collection(COLLECTION_NAME).doc(user.id).set(userData, { merge: true });
        return ok(undefined);
      }

      // If we are on the server but adminFirestore is null, this is a CRITICAL configuration error.
      if (typeof window === 'undefined') {
        logger.error({ event: 'UserRepository: Admin Firestore unavailable on server', id: user.id });
        return err(internalError('Service configuration error (Admin Firestore)'));
      }

      // Browser fallback (standard client-side update)
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, COLLECTION_NAME, user.id), userData, { merge: true });
      return ok(undefined);
    } catch (e: any) {
      logger.error({ event: 'UserRepository: Failed to save user', error: e.message, id: user.id });
      return err(internalError('Database error while saving user'));
    }
  },

  /**
   * Fetches users by role.
   */
  async getUsersByRole(role: UserRole): Promise<Result<User[], AppError>> {
    try {
      const { adminFirestore } = getFirebaseAdmin();

      if (adminFirestore) {
        const querySnapshot = await adminFirestore.collection(COLLECTION_NAME).where('role', '==', role).get();
        const users: User[] = [];
        querySnapshot.forEach((doc: any) => users.push({ id: doc.id, ...doc.data() } as User));
        return ok(users);
      } else {
        const { query, collection, where, getDocs } = await import('firebase/firestore');
        const q = query(collection(db, COLLECTION_NAME), where('role', '==', role));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        return ok(users);
      }
    } catch (e: any) {
      logger.error({ event: 'UserRepository: Failed to fetch users by role', error: e.message, role });
      return err(internalError('Database error while fetching users by role'));
    }
  }
};
