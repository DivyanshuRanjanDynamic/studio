import { VendorLoader } from '@/components/PageLoaders';

// Sits above vendor/layout.tsx so it shows while the server verifies the session.
export default function VendorLoading() {
  return <VendorLoader />;
}
