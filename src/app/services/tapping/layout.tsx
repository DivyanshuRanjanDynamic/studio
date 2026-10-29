import { TAPPING, serviceMetadata } from '@/lib/services/service-pages';

export const metadata = serviceMetadata(TAPPING, 'tapping');

export default function TappingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
