import { z } from 'zod';

export const VENDOR_CAPABILITIES = [
  'CNC Machining',
  'Laser Cutting',
  'Welding',
  'Fabrication',
  'Bending',
  'Surface Finish',
  'Other',
] as const;

export const VENDOR_APPLICATION_STATUSES = ['pending', 'approved', 'rejected'] as const;

export type VendorCapability = (typeof VENDOR_CAPABILITIES)[number];
export type VendorApplicationStatus = (typeof VENDOR_APPLICATION_STATUSES)[number];

export const NDA_AGREEMENT_TEXT = `Vendor agrees to maintain confidentiality of all customer designs, drawings, pricing and business information shared via MechHub platform. Vendor shall not directly contact MechHub clients without platform consent.
Vendor MechHub moolam varum design, drawing, business vivarangalai rahasiyama kaappathuvathu oppukollugirar.`;

export const indianPhoneRegex = /^[6-9]\d{9}$/;
export const gstRegex = /^([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})$/i;

export const vendorApplicationBaseSchema = z.object({
  companyName: z.string().trim().min(2, 'Company name is required').max(120),
  ownerName: z.string().trim().min(2, 'Owner name is required').max(120),
  contactNumber: z
    .string()
    .trim()
    .regex(indianPhoneRegex, 'Enter a valid 10-digit Indian mobile number'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  workshopAddress: z.string().trim().min(10, 'Workshop address is required').max(600),
  gstNumber: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || gstRegex.test(v), 'Enter a valid GST number'),
  capabilities: z
    .array(z.enum(VENDOR_CAPABILITIES))
    .min(1, 'Select at least one manufacturing capability'),
  otherCapability: z
    .string()
    .trim()
    .optional()
    .transform((v) => v || undefined)
    .refine((v) => !v || v.length >= 2, 'Please specify the other capability'),
  commissionStructure: z.string().trim().optional().transform((v) => v || undefined),
  monthlyRevenue: z.string().trim().optional().transform((v) => v || undefined),
  paymentTerms: z.string().trim().optional().transform((v) => v || undefined),
  ndaAgreed: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Confidentiality & NDA Agreement' }),
  }),
});

export const vendorApplyRequestSchema = vendorApplicationBaseSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters').max(72),
});

export type VendorApplyRequest = z.infer<typeof vendorApplyRequestSchema>;

export interface VendorApplicationRecord {
  companyName: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  workshopAddress: string;
  gstNumber?: string;
  capabilities: string[];
  commissionStructure?: string;
  monthlyRevenue?: string;
  paymentTerms?: string;
  ndaAgreed: true;
  status: VendorApplicationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  remindersSent: number;
  lastReminderAt: string | null;
  userId: string;
}
