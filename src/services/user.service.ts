import { UserRepository } from '@/repositories/user.repository';
import { User, UserRole, UserStatus } from '@/models/user.model';
import { userProfileUpdateSchema, userCreateSchema, UserProfileUpdateInput } from '@/validators/user.validator';
import { Result, ok, err } from '@/utils/result';
import { AppError, validationError, internalError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { NotificationService } from '@/services/notification.service';
import { isAdmin } from '@/lib/auth-utils';
import { getFirebaseAdmin } from '@/lib/firebase-admin';

/**
 * UserService orchestrates business logic for users,
 * bridging repositories, validators, and external services.
 */
export const UserService = {
  /**
   * Synchronizes an Auth user with their Firestore document.
   *
   * IMPORTANT: This is called on EVERY login via the session API.
   * It must NOT overwrite role, status, or createdAt for existing users,
   * EXCEPT to elevate whitelisted admins.
   */
  async syncUserFromAuth(params: {
    uid: string;
    email: string;
    fullName?: string;
    role?: UserRole;
    emailVerified?: boolean;
    allowCreation?: boolean;
  }): Promise<Result<void, AppError>> {
    const { uid, email, fullName, role: providedRole, emailVerified = false, allowCreation = false } = params;

    logger.info({ event: 'UserService: Syncing user from auth', uid, email });

    // Identify the intended role based on configuration and provided hints
    // The whitelist (isAdmin) is the absolute source of truth for admins.
    const isWhitelistedAdmin = isAdmin(email);
    const targetRole: UserRole = isWhitelistedAdmin ? 'admin' : (providedRole || 'customer');

    // 1. Check if the user document already exists
    const existingUser = await UserRepository.getUserById(uid);

    if (existingUser.success) {
      // ── Layer 1: Sync Existing User ───────────────────────────────
      const updateData: Record<string, any> = {
        id: uid,
        emailVerified,
        lastLoginAt: new Date().toISOString(),
      };

      // Admin Elevation: Whitelist is the source of truth
      if (isAdmin(email) && existingUser.data.role !== 'admin') {
        logger.info({ event: 'UserService: Elevating user to admin', uid, email });
        updateData.role = 'admin';

        const { adminAuth } = getFirebaseAdmin();
        if (adminAuth) {
          await adminAuth.setCustomUserClaims(uid, { admin: true });
        }
      }

      const saveResult = await UserRepository.saveUser(updateData as any);
      return saveResult;
    }

    // ── Layer 2: Self-Registration Bypass Guard ───────────────────
    // Unless the user is a whitelisted Admin OR we are explicitly 
    // allowing creation (e.g. during manual registration verification),
    // we forbid auto-creating a user document.
    if (!isAdmin(email) && !allowCreation) {
      logger.warn({ event: 'UserService: Blocked unauthorized auto-registration', email, uid });
      throw new Error('Account not found. Please register manually via the signup form.');
    }

    // ── Layer 3: Provision New User ──────────────────────────────
    const isActuallyAdmin = targetRole === 'admin';

    logger.info({ event: 'UserService: Provisioning user', email, uid, role: targetRole });

    const nowIso = new Date().toISOString();
    const userCreateData = {
      id: uid,
      email,
      fullName: fullName || email.split('@')[0],
      role: targetRole as UserRole,
      status: 'active' as UserStatus,
      emailVerified,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso,
    };

    const saveResult = await UserRepository.saveUser(userCreateData);
    if (!saveResult.success) return saveResult;

    // Set claims ONLY for admins
    if (isActuallyAdmin) {
      const { adminAuth } = getFirebaseAdmin();
      if (adminAuth) {
        await adminAuth.setCustomUserClaims(uid, { admin: true });
      }
    }

    // Trigger post-registration logic (welcome email)
    if (emailVerified) {
      const notificationStack: any[] = [
        {
          type: 'welcome',
          customer: { email, name: userCreateData.fullName },
        },
      ];

      // Only notify other admins if a new ADMIN is provisioned via whitelist
      if (isActuallyAdmin) {
        notificationStack.push({
          type: 'admin_new_user',
          userName: userCreateData.fullName,
          userEmail: email,
        });
      }

      NotificationService.sendAllAsync(notificationStack);
    }

    return ok(undefined);
  },

  /**
   * Updates a user's profile with validation.
   */
  async updateProfile(uid: string, input: UserProfileUpdateInput): Promise<Result<void, AppError>> {
    logger.info({ event: 'UserService: Updating profile', uid });

    const validation = userProfileUpdateSchema.safeParse(input);
    if (!validation.success) {
      return err(validationError(validation.error.errors[0].message));
    }

    const updateResult = await UserRepository.saveUser({
      id: uid,
      ...validation.data,
      updatedAt: new Date().toISOString(),
    });

    return updateResult;
  },

  /**
   * Fetches a complete user profile.
   */
  async getProfile(uid: string): Promise<Result<User, AppError>> {
    return UserRepository.getUserById(uid);
  },

  /**
   * Lists all vendors for the marketplace.
   */
  async listVendors(): Promise<Result<User[], AppError>> {
    // Both 'vendor' and 'mechmaster' are considered vendors in the UI usually
    const vendorsResult = await UserRepository.getUsersByRole('vendor');
    if (!vendorsResult.success) return vendorsResult;

    const mechmastersResult = await UserRepository.getUsersByRole('mechmaster');
    if (!mechmastersResult.success) return mechmastersResult;

    return ok([...vendorsResult.data, ...mechmastersResult.data]);
  }
};
