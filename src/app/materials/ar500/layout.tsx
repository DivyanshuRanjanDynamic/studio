import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AR500 Steel Sheet Metal | Laser Cut to Order | MechHub',
  description:
    'AR500 abrasion-resistant steel sheet in 5 thicknesses, laser cut to your design with ±.005" tolerance. For parts that face extreme abrasion. Ships in 2–4 days.',
  alternates: {
    canonical: '/materials/ar500',
  },
};

export default function Ar500Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
