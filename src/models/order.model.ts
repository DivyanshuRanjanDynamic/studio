import type { QuoteCartItem } from '@/types/quoting';

export interface ShippingAddress {
  readonly fullName: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly city: string;
  readonly state: string;
  readonly pincode: string;
  readonly phone: string;
  readonly isGstInvoicing: boolean;
  readonly gstNumber?: string;
  readonly companyName?: string;
}

export interface ShippingOption {
  readonly id: string;
  readonly label: string;
  readonly estimatedDays: number;
  readonly price: number; // INR
  readonly carrier: string;
}

export type OrderStatus =
  | 'quoted'
  | 'paid'
  | 'in_production'
  | 'quality_check'
  | 'packaging'
  | 'shipped'
  | 'delivered';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'refunded';

export interface QuoteOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly userId: string;
  readonly items: readonly QuoteCartItem[];
  readonly shopItems?: readonly any[];
  readonly shippingAddress: ShippingAddress;
  readonly shippingOption: ShippingOption;
  readonly subtotal: number;
  readonly gst: number;
  readonly shippingCost: number;
  readonly total: number;
  readonly status: OrderStatus;
  readonly paymentStatus: PaymentStatus;
  readonly razorpayOrderId?: string;
  readonly razorpayPaymentId?: string;
  readonly projectId?: string;
  readonly isAdvance?: boolean;
  readonly isBalance?: boolean;
  readonly advancePercentage?: number;
  readonly createdAt: string;
  readonly paidAt?: string;
  readonly shippedAt?: string;
  readonly estimatedDeliveryDate?: string;
  readonly trackingNumber?: string;
}

export interface OrderConfirmation {
  readonly orderNumber: string;
  readonly total: number;
  readonly estimatedDeliveryDate: string;
  readonly items: readonly QuoteCartItem[];
  readonly shopItems?: readonly any[];
  readonly shippingAddress: ShippingAddress;
}

export const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'std_ground',
    label: 'Standard Ground',
    estimatedDays: 5,
    price: 150, // INR
    carrier: 'BlueDart',
  },
  {
    id: 'exp_air',
    label: 'Express Air',
    estimatedDays: 2,
    price: 450, // INR
    carrier: 'Delhivery',
  },
];
