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

export const orderCreateSchema = z
  .object({
    items: z.array(
      z.object({
        id: z.string().min(1),
        fileName: z.string().min(1),
        quote: z.record(z.any()), // Ensuring it's a non-null object
      })
    ).default([]),
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
  });

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
