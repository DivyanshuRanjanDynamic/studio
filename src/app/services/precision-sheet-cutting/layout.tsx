import { PRECISION_SHEET_CUTTING, serviceMetadata } from '@/lib/services/service-pages';

export const metadata = serviceMetadata(PRECISION_SHEET_CUTTING, 'precision-sheet-cutting');

export default function PrecisionSheetCuttingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
