import type { Metadata } from 'next';

// Applies to /shop only: /shop/[id] sets its own title and canonical in its layout.
// Filtered URLs (/shop?category=…&q=…) keep this canonical, so they don't compete
// with the main listing in search.
export const metadata: Metadata = {
  title: 'Shop Industrial Components | MechHub',
  description:
    'Bearings, linear motion, transmission parts, fasteners and raw materials. QC-verified, competitively priced, GST invoice included and ready to dispatch within 24 hours.',
  alternates: {
    canonical: '/shop',
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
