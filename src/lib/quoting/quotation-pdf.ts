import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';

// ═══════════════════════════════════════════════════
// quotation-pdf — render a project quotation as a PDF (pure, no I/O)
//
// Uses the standard Helvetica fonts, so money is written "Rs." (the ₹ glyph is
// not in the WinAnsi encoding and pdf-lib would throw). Titled "Quotation", an
// estimate before engineering review and final after — never a tax invoice.
// ═══════════════════════════════════════════════════

const NAVY = rgb(0.118, 0.227, 0.4); // #1E3A66
const BLUE = rgb(0.184, 0.373, 0.655); // #2F5FA7
const INK = rgb(0.1, 0.12, 0.15);
const MUTED = rgb(0.45, 0.47, 0.5);
const HAIR = rgb(0.85, 0.86, 0.88);

const PAGE_W = 595.28; // A4 portrait
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

export interface QuotationLineInput {
  readonly partName: string;
  readonly detail: string;
  readonly quantity: number;
  readonly unitPrice: number | null;
  readonly lineTotal: number | null;
  readonly pending: boolean;
}

export interface QuotationPdfInput {
  readonly quotationNumber: string;
  readonly issuedAt: Date;
  readonly validUntil: Date;
  readonly kind: 'estimate' | 'final';
  readonly projectName: string;
  readonly customer: {
    readonly name: string;
    readonly email?: string;
    readonly location?: string;
    readonly company?: string;
    readonly gstin?: string;
  };
  readonly lines: readonly QuotationLineInput[];
  readonly subtotal: number;
  readonly gst: number;
  readonly shipping: number;
  readonly total: number;
  readonly maxLeadTimeDays: number;
  readonly pendingPartCount: number;
}

const money = (n: number) => `Rs. ${Math.round(n).toLocaleString('en-IN')}`;
const date = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/** Clip text to a column width so nothing overruns the table */
function clip(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && font.widthOfTextAtSize(out + '…', size) > maxWidth) out = out.slice(0, -1);
  return out + '…';
}

export async function buildQuotationPdf(input: QuotationPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Quotation ${input.quotationNumber}`);
  pdf.setProducer('MechHub');
  pdf.setCreator('MechHub');

  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let page = pdf.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const text = (s: string, x: number, yy: number, size: number, f = font, color = INK) =>
    page.drawText(s, { x, y: yy, size, font: f, color });

  const rightText = (s: string, rightX: number, yy: number, size: number, f = font, color = INK) =>
    page.drawText(s, { x: rightX - f.widthOfTextAtSize(s, size), y: yy, size, font: f, color });

  // ── Header ──
  text('MechHub', MARGIN, y - 4, 22, bold, NAVY);
  text('On-demand manufacturing', MARGIN, y - 20, 9, font, MUTED);
  rightText('QUOTATION', PAGE_W - MARGIN, y - 2, 20, bold, BLUE);
  rightText(input.kind === 'final' ? 'Final quotation' : 'Instant estimate', PAGE_W - MARGIN, y - 18, 9, font, MUTED);
  y -= 44;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: HAIR });
  y -= 24;

  // ── Meta (left: bill to, right: numbers) ──
  const metaTop = y;
  text('QUOTE TO', MARGIN, y, 8, bold, MUTED);
  y -= 15;
  text(input.customer.name || 'Customer', MARGIN, y, 11, bold, INK);
  y -= 14;
  for (const detail of [input.customer.company, input.customer.email, input.customer.location].filter(Boolean) as string[]) {
    text(clip(detail, font, 10, CONTENT_W * 0.55), MARGIN, y, 10, font, MUTED);
    y -= 13;
  }
  if (input.customer.gstin) {
    text(`GSTIN: ${input.customer.gstin}`, MARGIN, y, 10, font, MUTED);
    y -= 13;
  }

  const rightX = PAGE_W - MARGIN;
  const labelX = PAGE_W - MARGIN - 150;
  let ry = metaTop;
  const metaRow = (label: string, value: string) => {
    text(label, labelX, ry, 9, font, MUTED);
    rightText(value, rightX, ry, 9, bold, INK);
    ry -= 15;
  };
  metaRow('Quotation no.', input.quotationNumber);
  metaRow('Project', clip(input.projectName || '—', bold, 9, 140));
  metaRow('Issued', date(input.issuedAt));
  metaRow('Valid until', date(input.validUntil));

  y = Math.min(y, ry) - 18;

  // ── Line-item table ──
  const col = { idx: MARGIN, part: MARGIN + 26, qty: MARGIN + 300, unit: MARGIN + 360, total: PAGE_W - MARGIN };
  const header = () => {
    page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 20, color: rgb(0.96, 0.97, 0.98) });
    text('#', col.idx + 4, y + 2, 8, bold, MUTED);
    text('PART', col.part, y + 2, 8, bold, MUTED);
    text('QTY', col.qty, y + 2, 8, bold, MUTED);
    rightText('UNIT', col.unit + 36, y + 2, 8, bold, MUTED);
    rightText('TOTAL', col.total, y + 2, 8, bold, MUTED);
    y -= 24;
  };
  header();

  input.lines.forEach((line, i) => {
    if (y < MARGIN + 140) {
      page = pdf.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN;
      header();
    }
    text(String(i + 1), col.idx + 4, y, 10, font, MUTED);
    text(clip(line.partName, bold, 10, 240), col.part, y, 10, bold, INK);
    if (line.detail) text(clip(line.detail, font, 8, 240), col.part, y - 11, 8, font, MUTED);
    text(String(line.quantity), col.qty + 2, y, 10, font, INK);
    if (line.pending || line.unitPrice === null) {
      rightText('—', col.unit + 36, y, 10, font, MUTED);
      rightText('To be quoted', col.total, y, 9, font, MUTED);
    } else {
      rightText(money(line.unitPrice), col.unit + 36, y, 10, font, INK);
      rightText(money(line.lineTotal ?? 0), col.total, y, 10, bold, INK);
    }
    y -= 26;
    page.drawLine({ start: { x: MARGIN, y: y + 8 }, end: { x: PAGE_W - MARGIN, y: y + 8 }, thickness: 0.5, color: HAIR });
  });

  // ── Totals ──
  y -= 10;
  const totalsX = PAGE_W - MARGIN - 220;
  const totalRow = (label: string, value: string, strong = false) => {
    text(label, totalsX, y, strong ? 11 : 10, strong ? bold : font, strong ? INK : MUTED);
    rightText(value, PAGE_W - MARGIN, y, strong ? 13 : 10, strong ? bold : font, strong ? NAVY : INK);
    y -= strong ? 22 : 16;
  };
  totalRow(input.kind === 'final' ? 'Quoted subtotal' : 'Parts subtotal', money(input.subtotal));
  totalRow('GST (18%)', money(input.gst));
  totalRow('Shipping', money(input.shipping));
  page.drawLine({ start: { x: totalsX, y: y + 6 }, end: { x: PAGE_W - MARGIN, y: y + 6 }, thickness: 1, color: HAIR });
  y -= 10;
  totalRow('Grand total', money(input.total), true);

  if (input.maxLeadTimeDays > 0) {
    y -= 4;
    rightText(`Estimated lead time: up to ${input.maxLeadTimeDays} days`, PAGE_W - MARGIN, y, 9, font, MUTED);
    y -= 16;
  }

  // ── Footer notes ──
  y = Math.max(y, MARGIN + 70);
  page.drawLine({ start: { x: MARGIN, y: y - 2 }, end: { x: PAGE_W - MARGIN, y: y - 2 }, thickness: 0.5, color: HAIR });
  y -= 16;
  const notes = [
    input.kind === 'final'
      ? 'This is your official quotation. Advance and balance are split 50/50.'
      : 'Instant estimate from your part geometry, before engineering review. Final pricing is confirmed in your quotation.',
    ...(input.pendingPartCount > 0
      ? [`${input.pendingPartCount} part(s) will be priced by our engineers and are not included in the total above.`]
      : []),
    `Valid until ${date(input.validUntil)}. Prices in INR, exclusive of any duties. This document is a quotation, not a tax invoice.`,
  ];
  for (const note of notes) {
    for (const row of wrap(note, font, 8.5, CONTENT_W)) {
      text(row, MARGIN, y, 8.5, font, MUTED);
      y -= 12;
    }
  }

  return pdf.save();
}

/** Word-wrap a string to a pixel width for the standard font */
function wrap(s: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = s.split(/\s+/);
  const rows: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) > maxWidth && line) {
      rows.push(line);
      line = w;
    } else {
      line = next;
    }
  }
  if (line) rows.push(line);
  return rows;
}
