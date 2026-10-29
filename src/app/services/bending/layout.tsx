import { BENDING, serviceMetadata } from '@/lib/services/service-pages';

export const metadata = serviceMetadata(BENDING, 'bending');

export default function BendingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
