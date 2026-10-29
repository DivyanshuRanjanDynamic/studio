import { POWDER_COATING, serviceMetadata } from '@/lib/services/service-pages';

export const metadata = serviceMetadata(POWDER_COATING, 'powder-coating');

export default function PowderCoatingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
