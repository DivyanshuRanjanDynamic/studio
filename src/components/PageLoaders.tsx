import { Loader2 } from 'lucide-react';
import { V2Shell } from '@/components/V2Shell';

/**
 * The one loading screen for the signed-in customer area (dashboard, profile,
 * orders, projects, checkout). (account)/loading.tsx shows it the moment a link is
 * clicked, and the pages show it again while their own data loads, so a
 * transition stays on one screen with the nav in place instead of flashing
 * between different spinners.
 */
export function AccountLoader() {
  return (
    <V2Shell noFooter>
      <div className="flex min-h-[60vh] items-center justify-center" role="status">
        <Loader2 className="size-8 animate-spin text-lp-primary" />
        <span className="sr-only">Loading</span>
      </div>
    </V2Shell>
  );
}

/** Loading screen for the vendor portal: its route loading.tsx and the page's own auth check. */
export function VendorLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status">
      <Loader2 className="animate-spin text-primary" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
