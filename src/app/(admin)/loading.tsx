import { AdminLoader } from '@/components/admin/AdminLoader';

// Sits above admin/layout.tsx so it shows while the server verifies the session.
export default function AdminLoading() {
  return <AdminLoader />;
}
