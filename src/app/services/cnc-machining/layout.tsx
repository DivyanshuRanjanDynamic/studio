import { CNC_MACHINING, serviceMetadata } from '@/lib/services/service-pages';

export const metadata = serviceMetadata(CNC_MACHINING, 'cnc-machining');

export default function CncMachiningLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
