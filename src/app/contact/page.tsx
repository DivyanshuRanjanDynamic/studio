import { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact MechHub | Precision Manufacturing Support',
  description:
    'Have a question about our CNC, laser cutting, or fabrication services? Get in touch with the MechHub team for custom quotes and project support.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
