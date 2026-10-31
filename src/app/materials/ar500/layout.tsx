import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AR500 Steel Plate | Laser Cut to Order | MechHub',
  description:
    'AR500 abrasion-resistant steel plate, laser cut to your design by verified MechMasters across India. For parts in severe wear. Quoted by our engineers.',
  alternates: {
    canonical: '/materials/ar500',
  },
};

export default function Ar500Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
