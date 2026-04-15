import { z } from 'zod';

/**
 * Regex for standard Indian phone numbers (10 digits starting with 6-9)
 */
export const PHONE_REGEX = /^[6-9]\d{9}$/;

/**
 * Schema for user preferences
 */
export const userPreferencesSchema = z.object({
  emailUpdates: z.boolean().default(true),
  orderNotifications: z.boolean().default(true),
  marketingUpdates: z.boolean().default(false),
});

/**
 * Schema for updating a basic user profile
 */
export const userProfileUpdateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100).trim(),
  phone: z.string().regex(PHONE_REGEX, 'Invalid Indian phone number').optional().or(z.literal('')),
  teamName: z.string().max(100).trim().optional().or(z.literal('')),
  designation: z.string().max(100).trim().optional().or(z.literal('')),
  location: z.string().max(200).trim().optional().or(z.literal('')),
  preferences: userPreferencesSchema.optional(),
});

/**
 * Schema for initial user registration/creation
 */
export const userCreateSchema = z.object({
  id: z.string().min(1),
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(2).max(100),
  role: z.enum(['customer', 'vendor', 'admin', 'mechmaster']).default('customer'),
  status: z.enum(['pending', 'active', 'suspended', 'deactivated']).default('pending'),
  emailVerified: z.boolean().default(false),
});

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
