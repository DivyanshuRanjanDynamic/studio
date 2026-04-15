import { z } from 'zod';

export const designFileSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().max(10 * 1024 * 1024), // 10MB limit per file
  type: z.string().optional(),
  dataUrl: z
    .string()
    .startsWith('data:')
    .max(15 * 1024 * 1024), // DataURL size limit
});

export const rfqCreateSchema = z.object({
  userName: z.string().min(1).max(100),
  userEmail: z.string().email(),
  userPhone: z.string().max(20).optional(),
  teamName: z.string().max(100).optional(),
  projectName: z.string().min(1).max(200),
  manufacturingProcess: z.string().max(500),
  material: z.string().max(200),
  thickness: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  quantity: z.number().min(1),
  surfaceFinish: z.string().max(200).optional(),
  tolerance: z.string().max(100),
  deliveryDate: z.string().optional(),
  budgetRange: z.string().max(100).optional(),
  deliveryLocation: z.string().min(1).max(500),
  extraRequirements: z.string().max(2000).optional(),
  designFiles: z.array(designFileSchema).max(5),
  selectedVendorIds: z.array(z.string()).min(1).max(20),
});

export type DesignFileInput = z.infer<typeof designFileSchema>;
export type RfqCreateInput = z.infer<typeof rfqCreateSchema>;
