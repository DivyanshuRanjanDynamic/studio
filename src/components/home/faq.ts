/** Home page FAQ. Shared by the FAQ section and the FAQPage JSON-LD in app/page.tsx. */
export type FaqItem = { q: string; a: string; link?: { href: string; label: string } };

export const FAQ: FaqItem[] = [
  {
    q: 'Which file formats can I upload?',
    a: 'STEP files. Upload yours through the NDA protected portal, then choose the process, material and thickness.',
  },
  {
    q: 'How fast will I get my parts?',
    a: 'Orders are delivered in 72 hours on average. The exact time depends on the process, quantity and finishing you choose.',
  },
  {
    q: 'Is there a minimum order?',
    a: 'There is no minimum quantity, so you can order a single prototype. A small minimum order value applies.',
  },
  {
    q: 'Who makes my parts?',
    a: 'A MechMaster: a manufacturing partner who has passed our technical and delivery checks and signed a full NDA contract.',
  },
  {
    q: 'How is my design protected?',
    a: 'Every MechMaster signs an NDA before seeing your file, and designs are kept in encrypted storage.',
    link: { href: '/nda-policy', label: 'Read the NDA policy' },
  },
  {
    q: 'Which materials can I choose?',
    a: 'Aluminium, mild steel, stainless steel, carbon fibre, acrylic, wood and 3D printing filaments, each with the thicknesses and processes it supports.',
    link: { href: '/materials', label: 'Browse all materials' },
  },
  {
    q: 'What does the quote include?',
    a: 'Material, cut length, pierces, setup, finishing and delivery, each on its own line. No hidden fees.',
  },
  {
    q: 'Where do you deliver?',
    a: 'Anywhere in India. You can track every stage of your order until it reaches your door.',
  },
  {
    q: 'What if a part arrives wrong?',
    a: 'Every order is QC inspected before dispatch. If something is still wrong, our refund policy explains what happens next.',
    link: { href: '/refund-policy', label: 'Read the refund policy' },
  },
  {
    q: 'I run a workshop. Can I make parts for MechHub?',
    a: 'Yes. Apply to become a MechMaster and receive orders from verified buyers through the platform.',
    link: { href: '/onboard', label: 'Apply to join' },
  },
];
