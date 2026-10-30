import { AccountLoader } from '@/components/PageLoaders';

// Sits above dashboard/layout.tsx so it shows the instant a link is clicked,
// while the server is still verifying the session. Next.js also prefetches it.
export default function AccountLoading() {
  return <AccountLoader />;
}
