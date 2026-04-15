import { UserRepository } from '@/repositories/user.repository';
import { User, UserRole, UserStatus } from '@/models/user.model';
import { userProfileUpdateSchema, userCreateSchema, UserProfileUpdateInput } from '@/validators/user.validator';
import { Result, ok, err } from '@/utils/result';
import { AppError, validationError, internalError } from '@/utils/errors';
import { logger } from '@/utils/logger';
import { NotificationService } from '@/services/notification.service';

/**
 * UserService orchestrates business logic for users,
 * bridging repositories, validators, and external services.
 */
export const UserService = {
  /**
   * Synchronizes an Auth user with their Firestore document.
   * Typically called after email verification or registration.
   */
  async syncUserFromAuth(params: {
    uid: string;
    email: string;
    fullName?: string;
    role?: UserRole;
    emailVerified?: boolean;
  }): Promise<Result<void, AppError>> {
    const { uid, email, fullName, role = 'customer', emailVerified = false } = params;

    logger.info({ event: 'UserService: Syncing user from auth', uid, email });

    const userCreateData = {
      id: uid,
      email,
      fullName: fullName || email.split('@')[0],
      role,
      status: 'active' as UserStatus,
      emailVerified,
      createdAt: new Date().toISOString(),
    };

    // Validate initial creation data
    const validation = userCreateSchema.safeParse(userCreateData);
    if (!validation.success) {
      return err(validationError('Invalid user data for synchronization'));
    }

    const saveResult = await UserRepository.saveUser(userCreateData);
    if (!saveResult.success) return saveResult;

    // Trigger post-registration logic (e.g., welcome email)
    if (emailVerified) {
      await NotificationService.sendAllAsync([
        {
          type: 'welcome',
          customer: { email, name: userCreateData.fullName },
        },
        {
          type: 'admin_new_user',
          userName: userCreateData.fullName,
          userEmail: email,
        },
      ]);
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
