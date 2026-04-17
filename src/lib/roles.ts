import { UserRole } from '@/models/user.model';


export function isVendorRole(role: string | null | undefined): boolean {
  return role === 'vendor' || role === 'mechmaster';
}

export function isPendingVendorRole(role: string | null | undefined): boolean {
  return role === 'vendor_pending';
}

export function getDashboardHrefByRole(role: string | null | undefined): string {
  if (role === 'admin') return '/admin';
  if (isVendorRole(role)) return '/vendor';
  return '/dashboard';
}
