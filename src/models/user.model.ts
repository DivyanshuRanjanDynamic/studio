/**
 * User roles in the MechHub ecosystem.
 */
export type UserRole = 'customer' | 'vendor' | 'admin' | 'mechmaster';

/**
 * User status lifecycle.
 */
export type UserStatus = 'pending' | 'active' | 'suspended' | 'deactivated';

/**
 * Base User entity stored in Firestore.
 */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly fullName: string;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly phone?: string;
  readonly teamName?: string;
  readonly designation?: string;
  readonly location?: string;
  readonly imageUrl?: string;
  readonly preferences?: UserPreferences;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastLoginAt?: string;
  readonly emailVerified: boolean;
}

/**
 * User preferences for notifications and UI.
 */
export interface UserPreferences {
  readonly emailUpdates: boolean;
  readonly orderNotifications: boolean;
  readonly marketingUpdates: boolean;
}

/**
 * Vendor-specific profile details.
 */
export interface VendorProfile extends User {
  readonly role: 'vendor' | 'mechmaster';
  readonly specializations: string[];
  readonly rating: number;
  readonly isVerified: boolean;
  readonly bio?: string;
  readonly joinedAt: string;
}

/**
 * Admin-specific profile details.
 */
export interface AdminProfile extends User {
  readonly role: 'admin';
  readonly permissions: string[];
}
