import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AR400 Steel Sheet Metal | Laser Cut to Order | MechHub',
  description:
    'AR400 abrasion-resistant steel sheet, laser cut to your design with ±.005" tolerance. Built for wear and impact in construction and mining equipment. Ships in 2–4 days.',
  alternates: {
    canonical: '/materials/ar400',
  },
};

export default function Ar400Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
