import { ANODIZING, serviceMetadata } from '@/lib/services/service-pages';

export const metadata = serviceMetadata(ANODIZING, 'anodizing');

export default function AnodizingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
