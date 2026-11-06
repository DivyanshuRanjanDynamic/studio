import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a MechMaster | MechHub',
  description:
    'Apply to join the MechHub manufacturing network. Laser, CNC and fabrication shops get orders from verified buyers with drawings and specs sorted.',
  alternates: { canonical: '/onboard' },
};

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
