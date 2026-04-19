import { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: "About MechHub | Building India's Precision Infrastructure",
  description:
    'MechHub is an institutional-grade marketplace connecting design teams with verified CNC, laser, and fabrication experts across India.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return <AboutClient />;
}
