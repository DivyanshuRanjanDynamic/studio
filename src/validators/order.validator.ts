import { z } from 'zod';

const INDIA_PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const INDIA_PHONE_REGEX = /^[6-9]\d{9}$/;
const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/;

export const shippingAddressSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required').max(100),
    phone: z.string().regex(INDIA_PHONE_REGEX, 'Invalid Indian phone number (10 digits)'),
    addressLine1: z.string().min(5, 'Address is too short').max(500),
    addressLine2: z.string().max(500).optional(),
    city: z.string().min(2, 'City is required').max(100),
    state: z.string().min(2, 'State is required').max(100),
    pincode: z.string().regex(INDIA_PINCODE_REGEX, 'Invalid Indian pincode (6 digits)'),
    isGstInvoicing: z.boolean(),
    gstNumber: z
      .string()
      .regex(GST_REGEX, 'Invalid GST format (e.g. 29AAAAA0000A1Z5)')
      .optional()
      .or(z.literal('')),
    companyName: z.string().min(2, 'Company name is required for GST').optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.isGstInvoicing) {
        return !!data.gstNumber && !!data.companyName;
      }
      return true;
    },
    {
      message: 'GST details are required when business invoicing is selected',
      path: ['gstNumber'],
    }
  );

// C2 fix: idempotencyKey is required — prevents duplicate Razorpay orders and
// internal orders on double-click / network retry. The controller stores it in
// idempotency_keys/{order_<key>} inside a transaction so only one request
// proceeds per key. Accepting only URL-safe alphanum chars prevents injection.
const IDEMPOTENCY_KEY_REGEX = /^[A-Za-z0-9_-]{16,64}$/;

export const orderCreateSchema = z
  .object({
    // C2 fix: idempotencyKey to deduplicate double-clicks / network retries.
    idempotencyKey: z
      .string()
      .regex(
        IDEMPOTENCY_KEY_REGEX,
        'idempotencyKey must be 16–64 URL-safe characters (A-Z, a-z, 0-9, _, -)'
      )
      .optional(),
    items: z.array(
      z.object({
        id: z.string().min(1),
        fileName: z.string().min(1),
        quote: z.record(z.any()), // Ensuring it's a non-null object
      })
    ).max(50).default([]), // bounded: a huge array is a memory-exhaustion vector (zod <4.6.6)
    shopItems: z
      .array(
        z.object({
          id: z.string(),
          name: z.string(),
          salePrice: z.number(),
          basePrice: z.number().optional(),
          quantity: z.number().min(1),
          image: z.string().optional(),
          sku: z.string(),
          inventory: z.number(),
        })
      )
      .max(50)
      .optional()
      .default([]),
    shippingAddress: shippingAddressSchema,
    shippingOptionId: z.string().min(1),
    userId: z.string().min(1),
    projectId: z.string().optional(),
    isAdvance: z.boolean().optional(),
    isBalance: z.boolean().optional(),
    advancePercentage: z.number().min(0.01).max(1).optional(),
  })
  .refine((data) => data.items.length > 0 || data.shopItems.length > 0, {
    message: 'At least one item (quote or product) is required',
    path: ['items'],
  })
  // Pricing charges the balance but payment recording checks isAdvance first,
  // which would move a shipped project back into production.
  .refine((data) => !(data.isAdvance && data.isBalance), {
    message: 'An order pays either the advance or the balance, not both',
    path: ['isBalance'],
  });

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
