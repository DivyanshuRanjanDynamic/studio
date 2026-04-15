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
      } else {
        const { getDoc, doc } = await import('firebase/firestore');
        const userSnap = await getDoc(doc(db, COLLECTION_NAME, id));
        if (!userSnap.exists()) return err(notFoundError('User', id));
        return ok({ id: userSnap.id, ...userSnap.data() } as User);
      }
    } catch (e: any) {
      logger.error({ event: 'UserRepository: Failed to fetch user', error: e.message, id });
      return err(internalError('Database error while fetching user'));
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
      } else {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(db, COLLECTION_NAME, user.id), userData, { merge: true });
        return ok(undefined);
      }
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
