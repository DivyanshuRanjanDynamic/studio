import { COUNTERSINKING, serviceMetadata } from '@/lib/services/service-pages';

export const metadata = serviceMetadata(COUNTERSINKING, 'countersinking');

export default function CountersinkingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
