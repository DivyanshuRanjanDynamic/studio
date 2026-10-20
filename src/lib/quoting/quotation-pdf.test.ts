import { describe, it, expect } from 'vitest';
import { buildQuotationPdf, type QuotationPdfInput } from './quotation-pdf';

// ═══════════════════════════════════════════════════
// Quotation PDF builder — produces a valid PDF without throwing
// ═══════════════════════════════════════════════════

const base: QuotationPdfInput = {
  quotationNumber: 'MH-Q-2026-ABC123',
  issuedAt: new Date('2026-10-20T00:00:00Z'),
  validUntil: new Date('2026-10-27T00:00:00Z'),
  kind: 'estimate',
  projectName: 'Gearbox housing',
  customer: { name: 'Asha Rao', email: 'asha@example.in', location: 'Bengaluru, KA' },
  lines: [
    { partName: 'Motor bracket', detail: 'Aluminium 6061 · CNC Milling/Turning', quantity: 10, unitPrice: 500, lineTotal: 5000, pending: false },
    { partName: 'Cover plate', detail: 'Stainless Steel 304 · CNC Milling/Turning', quantity: 2, unitPrice: 1500, lineTotal: 3000, pending: false },
  ],
  subtotal: 8000,
  gst: 1440,
  shipping: 150,
  total: 9590,
  maxLeadTimeDays: 5,
  pendingPartCount: 0,
};

const header = (pdf: Uint8Array) => new TextDecoder().decode(pdf.slice(0, 5));

describe('buildQuotationPdf', () => {
  it('produces a non-trivial, valid PDF', async () => {
    const pdf = await buildQuotationPdf(base);
    expect(header(pdf)).toBe('%PDF-');
    expect(pdf.byteLength).toBeGreaterThan(1000);
  });

  it('handles pending parts, a final quote, long names and many rows without throwing', async () => {
    const final = await buildQuotationPdf({
      ...base,
      kind: 'final',
      projectName: 'A very long project name that should be clipped so it never overruns its column box',
      customer: { name: 'Asha', company: 'Acme Robotics Pvt Ltd', gstin: '29AAAAA0000A1Z5' },
      lines: [
        ...Array.from({ length: 40 }, (_, i) => ({
          partName: `Part number ${i + 1} with a rather long descriptive name`,
          detail: 'Mild Steel A36 · CNC Milling/Turning',
          quantity: i + 1,
          unitPrice: 100 * (i + 1),
          lineTotal: 100 * (i + 1) * (i + 1),
          pending: false,
        })),
        { partName: 'Sheet panel', detail: 'Sheet Metal Cutting', quantity: 5, unitPrice: null, lineTotal: null, pending: true },
      ],
      pendingPartCount: 1,
    });
    expect(header(final)).toBe('%PDF-');
    expect(final.byteLength).toBeGreaterThan(2000);
  });

  it('renders an empty project', async () => {
    const pdf = await buildQuotationPdf({ ...base, lines: [], subtotal: 0, gst: 0, total: 150, maxLeadTimeDays: 0 });
    expect(header(pdf)).toBe('%PDF-');
  });
});
