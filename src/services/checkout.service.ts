import {
  QuoteOrder,
  ShippingAddress,
  ShippingOption,
  OrderStatus,
  PaymentStatus,
} from '@/models/order.model';
import { QuoteResult, QuoteCartItem } from '@/types/quoting';
import { Result, ok, err } from '@/utils/result';
import { AppError, internalError, validationError } from '@/utils/errors';
import { OrderRepository } from '@/repositories/order.repository';
import { ProjectRepository } from '@/repositories/project.repository';
import { orderCreateSchema, OrderCreateInput } from '@/validators/order.validator';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { calculateProjectFinances } from '@/utils/finance';

/**
 * CheckoutService orchestrates the order creation and payment verification workflows.
 * It ensures data consistency between orders and their parent projects.
 */
export const CheckoutService = {
  /**
   * Creates a multi-part order from a cart with validation.
   */
  async createOrder(
    input: OrderCreateInput & { userId: string }
  ): Promise<Result<QuoteOrder, AppError>> {
    logger.info({
      event: 'CheckoutService: Creating multi-part order',
      userId: input.userId,
      projectId: input.projectId,
    });

    try {
      // 1. Validation
      const validation = orderCreateSchema.safeParse(input);
      if (!validation.success) {
        return err(validationError(validation.error.errors[0].message));
      }

      const {
        items,
        shopItems,
        shippingAddress,
        shippingOptionId,
        projectId,
        isAdvance,
        isBalance,
        advancePercentage,
        userId
      } = input;

      // 2. Resolve Shipping Option (In a real app, this would come from a registry or DB)
      // For this refactor, I'll keep the logic inline or import from model if exported
      const { SHIPPING_OPTIONS } = await import('@/models/order.model');
      const shippingOption = SHIPPING_OPTIONS.find(o => o.id === shippingOptionId);
      if (!shippingOption) return err(validationError('Invalid shipping option selected'));

      // 3. Verify DFM for all parts
      for (const item of items) {
        if (item.quote.hasBlockingIssues) {
          return err(validationError(`Part "${item.fileName}" has blocking DFM issues.`));
        }
      }

      // 4. Calculate Totals
      const quoteSubtotal = items.reduce((sum, item) => sum + item.quote.totalPrice, 0);
      const shopSubtotal = shopItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
      const subtotal = quoteSubtotal + shopSubtotal;

      const finances = calculateProjectFinances(subtotal, shippingOption.price);
      let finalTotal = finances.total;

      if (isAdvance) {
        finalTotal = finances.advance;
      } else if (isBalance) {
        finalTotal = finances.balance;
      }

      // 5. Build Order Object
      const orderId = `order_${nanoid(12)}`;
      const orderNumber = `MH-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

      const order: QuoteOrder = {
        id: orderId,
        orderNumber,
        userId,
        items: items as unknown as QuoteCartItem[],
        shopItems,
        shippingAddress: shippingAddress as ShippingAddress,
        shippingOption,
        subtotal,
        gst: finances.gst,
        shippingCost: finances.shipping,
        total: finalTotal,
        status: 'quoted',
        paymentStatus: 'pending',
        projectId,
        isAdvance,
        isBalance,
        advancePercentage,
        createdAt: new Date().toISOString(),
      };

      // 6. Persistence
      const saveResult = await OrderRepository.saveOrder(order);
      if (!saveResult.success) return saveResult as any;

      logger.info({ event: 'CheckoutService: Order created', orderId, orderNumber });
      return ok(order);
    } catch (e: any) {
      logger.error({ event: 'CheckoutService: Fatal error during creation', error: e.message });
      return err(internalError('Unexpected error during order creation'));
    }
  },

  /**
   * Finalizes an order after payment and syncs with parent project.
   */
  async markAsPaid(orderId: string, razorpayPaymentId: string): Promise<Result<void, AppError>> {
    try {
      const orderResult = await OrderRepository.getOrderById(orderId);
      if (!orderResult.success) return orderResult as any;

      const order = orderResult.data;
      const updatedOrder: Partial<QuoteOrder> & { id: string } = {
        id: orderId,
        paymentStatus: 'paid',
        status: 'paid',
        razorpayPaymentId,
        paidAt: new Date().toISOString(),
      };

      await OrderRepository.saveOrder(updatedOrder);
      logger.info({ event: 'CheckoutService: Order paid', orderId });

      // Sync with Project if applicable
      if (order.projectId) {
        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };

        if (order.isAdvance) {
          updateData.status = 'in_production';
          updateData['paymentStatus.advance'] = {
            paid: true,
            paidAt: new Date().toISOString(),
            razorpayPaymentId,
            amount: order.total,
          };
        } else if (order.isBalance) {
          updateData.status = 'delivered';
          updateData['paymentStatus.completion'] = {
            paid: true,
            paidAt: new Date().toISOString(),
            razorpayPaymentId,
            amount: order.total,
          };
        }

        await ProjectRepository.saveProjectRfq({ id: order.projectId, ...updateData });
        logger.info({ event: 'CheckoutService: Project status synced', projectId: order.projectId });
      }

      return ok(undefined);
    } catch (e: any) {
      logger.error({ event: 'CheckoutService: Payment verification failed', error: e.message, orderId });
      return err(internalError('Failed to update payment status'));
    }
  },
};
