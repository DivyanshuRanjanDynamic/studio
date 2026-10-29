import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Instant Quote — MechHub',
  description:
    'Upload your DXF or STEP file and get an instant manufacturing quote with live pricing, DFM feedback, and tier discounts.',
  alternates: {
    canonical: '/quote/instant',
  },
};

export default function InstantQuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
