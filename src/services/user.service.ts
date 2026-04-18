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
    expectedRole?: UserRole;
  }): Promise<Result<void, AppError>> {
    const { uid, email, fullName, role: providedRole, emailVerified = false, allowCreation = false, expectedRole } = params;

    logger.info({ event: 'UserService: Syncing user from auth', uid, email, expectedRole });

    // 1. Check if the user document already exists
    const existingUser = await UserRepository.getUserById(uid);

    if (existingUser.success) {
      // ── Layer 1: Role Mismatch Validation ──────────────────────────
      // Ensure the user is logging in through the correct portal.
      const actualRole = existingUser.data.role;

      if (expectedRole && actualRole !== 'admin') {
        const isVendorFlow = expectedRole === 'vendor';
        const isCustomerFlow = expectedRole === 'customer';
        const actualIsVendor = actualRole === 'vendor' || actualRole === 'mechmaster' || actualRole === 'vendor_pending';
        const actualIsCustomer = actualRole === 'customer';

        if (isVendorFlow && !actualIsVendor) {
          return err(internalError(`You are not registered as a Vendor.`));
        }
        if (isCustomerFlow && !actualIsCustomer) {
          const actualLabel = actualRole === 'vendor_pending' ? 'Partner' : 'Vendor';
          return err(internalError(`You are not registered as a Innovator.`));
        }
      }

      // ── Layer 2: Sync Existing User ───────────────────────────────
      const updateData: Record<string, any> = {
        id: uid,
        emailVerified,
        lastLoginAt: new Date().toISOString(),
      };

      // Ensure fullName is updated if the existing one is generic or missing
      const currentFullName = existingUser.data.fullName;
      const isGenericName = !currentFullName || currentFullName === email.split('@')[0];
      if (fullName && isGenericName) {
        updateData.fullName = fullName;
      }

      // Identify the intended role
      const isWhitelistedAdmin = isAdmin(email);

      // Sync role if missing or if admin elevation is needed
      if (!existingUser.data.role || (isWhitelistedAdmin && existingUser.data.role !== 'admin')) {
        updateData.role = isWhitelistedAdmin ? 'admin' : (providedRole || existingUser.data.role || 'customer');

        if (updateData.role === 'admin') {
          const { adminAuth } = getFirebaseAdmin();
          if (adminAuth) {
            await adminAuth.setCustomUserClaims(uid, { admin: true });
          }
        }
      }

      const saveResult = await UserRepository.saveUser(updateData as any);
      return saveResult;
    }

    // ── Layer 3: Self-Registration Bypass Guard ───────────────────
    if (!isAdmin(email) && !allowCreation) {
      logger.warn({ event: 'UserService: Blocked unauthorized auto-registration', email, uid });
      
      // EXTRA SAFETY: Before purging, check if any user exists with this email
      // (This handles cases where a user has a Password account but tries to log in via Google).
      const userWithEmail = await UserRepository.getUserByEmail(email);
      if (userWithEmail.success) {
        logger.info({ event: 'UserService: Skipping purge - email already exists in DB', email });
        const actualRole = userWithEmail.data.role;
        const roleLabel = actualRole === 'vendor_pending' ? 'Partner' : actualRole === 'mechmaster' ? 'Vendor' : actualRole;
        return err(internalError(`This email is already associated with a ${roleLabel} account. Please use the correct portal.`));
      }

      // Atomic Purge: Only if the user is TRULY not in our database via UID or Email.
      const { adminAuth } = getFirebaseAdmin();
      if (adminAuth) {
        try {
          await adminAuth.deleteUser(uid);
          logger.info({ event: 'UserService: Atomic purge successful', email, uid });
        } catch (e: any) {
          logger.error({ event: 'UserService: Atomic purge failed', error: e.message, uid });
        }
      }

      const roleLabel = expectedRole === 'vendor' ? 'Vendor' : 'Customer';
      return err(internalError(`You are not registered yet as a ${roleLabel}. Please register first using email & password.`));
    }

    // ── Layer 3: Provision New User ──────────────────────────────
    return this.provisionNewUser({
      uid,
      email,
      fullName,
      role: providedRole,
      emailVerified,
    });
  },

  /**
   * Proactively creates a user document in Firestore.
   * This should be called during the sign-up process to ensure the doc exists immediately.
   */
  async provisionNewUser(params: {
    uid: string;
    email: string;
    fullName?: string;
    role?: UserRole;
    emailVerified?: boolean;
  }): Promise<Result<void, AppError>> {
    const { uid, email, fullName, role: providedRole, emailVerified = false } = params;

    const isWhitelistedAdmin = isAdmin(email);
    const targetRole: UserRole = isWhitelistedAdmin ? 'admin' : (providedRole || 'customer');

    logger.info({ event: 'UserService: Provisioning new user', email, uid, role: targetRole });

    const nowIso = new Date().toISOString();
    const userCreateData = {
      id: uid,
      email,
      fullName: fullName || email.split('@')[0],
      role: targetRole,
      status: 'active' as UserStatus,
      emailVerified,
      onboarded: false,
      phone: '',
      teamName: '',
      designation: '',
      location: '',
      createdAt: nowIso,
      updatedAt: nowIso,
      lastLoginAt: nowIso,
    };

    const saveResult = await UserRepository.saveUser(userCreateData);
    if (!saveResult.success) return saveResult;

    // Set claims ONLY for admins
    if (targetRole === 'admin') {
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

      if (targetRole === 'admin') {
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
