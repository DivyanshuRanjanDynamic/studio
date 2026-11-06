/**
 * Facts shown on the sign in panel and the MechMaster application. Kept as plain data so
 * client screens do not pull the pricing engine into their bundle.
 *
 * EXAMPLE_QUOTE is the engine's real output for the reference plate (quoteShowcase() in
 * lib/services/service-facts.ts). auth-facts.test.ts fails if the two ever drift apart.
 */
export const EXAMPLE_QUOTE = {
  part: '200 × 100 mm plate, 4 holes',
  material: 'Aluminium 5052, 2 mm',
  process: 'Laser cutting',
  leadTimeDays: 3,
  prices: [
    { quantity: 1, label: '₹1,000' },
    { quantity: 10, label: '₹157' },
    { quantity: 100, label: '₹77' },
  ],
} as const;

export const SUPPORT = {
  phone: '+91 96070 43079',
  phoneHref: 'tel:+919607043079',
  email: 'outreach@mechhub.in',
  office: 'Atal Incubation Centre, Coimbatore',
} as const;

/** Processes a customer can order today: the nine pages under /services. */
export const PROCESSES = [
  'Sheet cutting',
  'CNC machining',
  'Bending',
  'Tapping',
  'Countersinking',
  'Dimple forming',
  'Hardware insertion',
  'Powder coating',
  'Anodizing',
] as const;
