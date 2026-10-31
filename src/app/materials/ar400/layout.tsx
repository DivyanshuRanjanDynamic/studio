import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AR400 Steel Plate | Laser Cut to Order | MechHub',
  description:
    'AR400 abrasion-resistant steel plate, laser cut to your design by verified MechMasters across India. Built for parts that face wear and impact. Quoted by our engineers.',
  alternates: {
    canonical: '/materials/ar400',
  },
};

export default function Ar400Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
