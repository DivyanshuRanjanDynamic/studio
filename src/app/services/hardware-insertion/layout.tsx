import { HARDWARE_INSERTION, serviceMetadata } from '@/lib/services/service-pages';

export const metadata = serviceMetadata(HARDWARE_INSERTION, 'hardware-insertion');

export default function HardwareInsertionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
