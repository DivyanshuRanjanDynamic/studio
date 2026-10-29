import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manufacturing Budget Estimator | MechHub — Plan Your Custom Parts Cost',
  description:
    'Get a rough budget range for CNC milling/turning, laser cutting, and fabrication in India. Free planning tool for engineers and startups — no signup required.',
  alternates: {
    canonical: '/quote',
  },
};

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
