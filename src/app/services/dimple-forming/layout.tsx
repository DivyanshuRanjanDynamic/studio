import { DIMPLE_FORMING, serviceMetadata } from '@/lib/services/service-pages';

export const metadata = serviceMetadata(DIMPLE_FORMING, 'dimple-forming');

export default function DimpleFormingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
