/**
 * Centralized error mapping for MechHub.
 * Transforms technical error codes (Firebase, AppError, etc.) into user-friendly messages.
 */

export type UserFriendlyMessage = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
} | null;

export function resolveUserFriendlyMessage(error: any): UserFriendlyMessage {
  // 1. Default fallback
  const defaultTitle = 'Something went wrong';
  const defaultDescription =
    'An unexpected error occurred. Please try again or contact support if the issue persists.';
  const defaultVariant: 'default' | 'destructive' = 'destructive';

  if (!error)
    return { title: defaultTitle, description: defaultDescription, variant: defaultVariant };

  // 2. Handle technical Firebase Auth errors
  if (typeof error.code === 'string') {
    switch (error.code) {
      case 'auth/popup-closed-by-user':
        // Silently ignore as the user knows they closed it
        return null;
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return {
          title: 'Authentication Failed',
          description:
            'The email or password you entered is incorrect. Please check your credentials and try again.',
          variant: 'destructive',
        };
      case 'auth/user-not-found':
        return {
          title: 'Account Not Found',
          description:
            'No account exists with this email address. Please verify the spelling or register for a new account.',
          variant: 'destructive',
        };
      case 'auth/email-already-in-use':
        return {
          title: 'Email already exists',
          description:
            'This email address is already registered. Try signing in or resetting your password.',
          variant: 'destructive',
        };
      case 'auth/weak-password':
        return {
          title: 'Password too weak',
          description:
            'For your security, please choose a stronger password with at least 8 characters.',
          variant: 'destructive',
        };
      case 'auth/too-many-requests':
        return {
          title: 'Account temporarily locked',
          description:
            'Too many failed attempts. Please try again in a few minutes or reset your password.',
          variant: 'destructive',
        };
      case 'auth/popup-closed-by-user':
        // Special case: Silently ignore or show a very subtle notice
        return {
          title: 'Sign-in cancelled',
          description: 'The sign-in process was cancelled. Close the window to try again.',
          variant: 'default',
        };
      case 'permission-denied':
      case 'auth/permission-denied':
        return {
          title: 'Access Restricted',
          description:
            "You don't have secondary permissions to perform this action. Please sign in with an authorized account.",
          variant: 'destructive',
        };
    }
  }

  // 3. Handle custom AppError (from lib/errors.ts)
  if (error.code && typeof error.code === 'string') {
    const code = error.code;
    if (code.startsWith('VALIDATION_')) {
      return {
        title: 'Invalid Input',
        description: error.message || 'Please check the information you entered and try again.',
        variant: 'destructive',
      };
    }
    if (code === 'NOT_FOUND') {
      return {
        title: 'Resource Not Found',
        description: 'The requested item could not be located. It may have been moved or deleted.',
        variant: 'destructive',
      };
    }
    if (code === 'INTERNAL_ERROR') {
      return {
        title: 'Server Error',
        description:
          'Our systems are experiencing a temporary issue. Please try again in 1-2 minutes.',
        variant: 'destructive',
      };
    }
  }

  // 4. Handle common string messages (from legacy catches)
  if (typeof error === 'string') {
    if (error.includes('Insufficient permissions')) {
      return {
        title: 'Access Restricted',
        description: "You don't have the necessary permissions to perform this action.",
        variant: 'destructive',
      };
    }
  }

  // 4. Handle standard Error objects
  if (error instanceof Error) {
    // If it's a generic Error but has a helpful message, we might use it sparingly,
    // but for a premium feel, we should mask raw technical messages.
    if (error.message.includes('Missing or insufficient permissions')) {
      // Silently ignore generic permission errors from useCollection/useDoc 
      // during login/logout transitions to improve UX.
      return null;
    }
  }

  return { title: defaultTitle, description: defaultDescription, variant: defaultVariant };
}
