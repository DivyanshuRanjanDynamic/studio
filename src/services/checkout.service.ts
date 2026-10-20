import {
  QuoteOrder,
  ShippingAddress,
  ShippingOption,
  SHIPPING_OPTIONS,
} from '@/models/order.model';
import { QuoteCartItem } from '@/types/quoting';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode, internalError, validationError } from '@/utils/errors';
import { OrderRepository } from '@/repositories/order.repository';
import { ProjectRepository } from '@/repositories/project.repository';
import { QuotesRepository } from '@/lib/firebase/repositories/quotes';
import { ProductRepository } from '@/repositories/product.repository';
import { orderCreateSchema, OrderCreateInput } from '@/validators/order.validator';
import { logger } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { calculateProjectFinances, ProjectFinances } from '@/utils/finance';

/** Cart totals are display copies; anything beyond rounding noise is rejected */
const PRICE_TOLERANCE_INR = 0.01;

type CartItemInput = OrderCreateInput['items'][number];
type ShopItemInput = OrderCreateInput['shopItems'][number];

/** A shop line priced from the product catalogue (same shape the order stores) */
export interface PricedShopItem {
  readonly id: string;
  readonly name: string;
  readonly sku: string;
  readonly salePrice: number;
  readonly basePrice?: number;
  readonly quantity: number;
  readonly image?: string;
  readonly inventory: number;
}

export interface PricedOrder {
  /** Cart items with `quote` replaced by the saved quote of record */
  readonly items: QuoteCartItem[];
  /** Shop items with name / SKU / price taken from the catalogue */
  readonly shopItems: PricedShopItem[];
  readonly shippingOption: ShippingOption;
  readonly subtotal: number;
  readonly finances: ProjectFinances;
  /** Amount to charge now (full, advance or balance) */
  readonly total: number;
}

export type CreateOrderInput = OrderCreateInput & { userId: string; razorpayOrderId?: string };

/**
 * CheckoutService orchestrates the order creation and payment verification workflows.
 * It ensures data consistency between orders and their parent projects.
 */
export const CheckoutService = {
  /**
   * Replaces each cart quote with its saved copy (by quoteRef). The cart lives in
   * localStorage, so its prices are never trusted: a missing, expired, blocked or
   * re-priced quote fails the order instead of being charged.
   */
  async resolveCartQuotes(
    items: readonly CartItemInput[]
  ): Promise<Result<QuoteCartItem[], AppError>> {
    const lookups = await Promise.all(
      items.map(async (item) => {
        const quoteRef = item.quote?.quoteRef;
        if (typeof quoteRef !== 'string' || quoteRef.length === 0) {
          return { item, quoteRef: null, stored: null };
        }
        return { item, quoteRef, stored: await QuotesRepository.getQuoteByRef(quoteRef) };
      })
    );

    const resolved: QuoteCartItem[] = [];
    const now = Date.now();

    for (const { item, quoteRef, stored } of lookups) {
      if (!quoteRef || !stored) {
        return err(
          validationError(`Part "${item.fileName}" has no saved quote. Please re-quote it.`, {
            itemId: item.id,
          })
        );
      }

      if (!stored.success) {
        if (stored.error.code === ErrorCode.NOT_FOUND) {
          return err(
            validationError(
              `Quote ${quoteRef} for "${item.fileName}" was not found. Please re-quote this part.`,
              { quoteRef }
            )
          );
        }
        return err(stored.error);
      }

      const { userId: _owner, ...quote } = stored.data;

      if (quote.expiresAt <= now) {
        return err(
          new AppError({
            code: ErrorCode.QUOTE_EXPIRED,
            message: `Quote ${quoteRef} for "${item.fileName}" has expired. Please re-quote this part.`,
            statusCode: 410,
            context: { quoteRef, expiresAt: quote.expiresAt },
          })
        );
      }

      if (quote.hasBlockingIssues) {
        return err(validationError(`Part "${item.fileName}" has blocking DFM issues.`, { quoteRef }));
      }

      const cartTotal = Number(item.quote.totalPrice);
      if (!Number.isFinite(cartTotal) || Math.abs(cartTotal - quote.totalPrice) > PRICE_TOLERANCE_INR) {
        logger.warn({
          event: 'CheckoutService: Cart total does not match saved quote',
          quoteRef,
          cartTotal: item.quote.totalPrice,
          savedTotal: quote.totalPrice,
        });
        return err(
          validationError(
            `The price for "${item.fileName}" no longer matches quote ${quoteRef}. Remove it from your cart and re-quote.`,
            { quoteRef }
          )
        );
      }

      resolved.push({ id: item.id, fileName: item.fileName, quote: quote as QuoteCartItem['quote'] });
    }

    return ok(resolved);
  },

  /**
   * Prices shop items from the product catalogue. The cart's salePrice is only a
   * display copy: a missing, inactive, out-of-stock or re-priced product fails
   * the order rather than being charged at the cart's price.
   */
  async resolveShopItems(
    items: readonly ShopItemInput[]
  ): Promise<Result<PricedShopItem[], AppError>> {
    // One line per product, so repeated ids can't dodge the stock check.
    const quantities = new Map<string, { quantity: number; cart: ShopItemInput }>();
    for (const item of items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return err(validationError(`Invalid quantity for "${item.name}".`, { productId: item.id }));
      }
      const prev = quantities.get(item.id);
      quantities.set(item.id, { quantity: (prev?.quantity ?? 0) + item.quantity, cart: prev?.cart ?? item });
    }

    const products = await ProductRepository.getProductsByIds([...quantities.keys()]);
    if (!products.success) return err(products.error);

    const priced: PricedShopItem[] = [];
    for (const [id, { quantity, cart }] of quantities) {
      const product = products.data.get(id);
      if (!product || product.isActive === false) {
        return err(
          validationError(`"${cart.name}" is no longer available. Remove it from your cart.`, { productId: id })
        );
      }

      const salePrice = Number(product.salePrice);
      if (!Number.isFinite(salePrice) || salePrice <= 0) {
        logger.error({ event: 'CheckoutService: Product has no valid price', productId: id });
        return err(validationError(`"${product.name ?? cart.name}" can't be ordered right now.`, { productId: id }));
      }

      const inventory = Number(product.inventory ?? 0);
      if (inventory < quantity) {
        return err(
          validationError(`Insufficient stock for ${product.name ?? cart.name}. Available: ${inventory}`, {
            productId: id,
          })
        );
      }

      if (Math.abs(Number(cart.salePrice) - salePrice) > PRICE_TOLERANCE_INR) {
        logger.warn({
          event: 'CheckoutService: Cart price does not match catalogue',
          productId: id,
          cartPrice: cart.salePrice,
          catalogPrice: salePrice,
        });
        return err(
          validationError(
            `The price of "${product.name ?? cart.name}" has changed. Refresh your cart and try again.`,
            { productId: id }
          )
        );
      }

      priced.push({
        id,
        name: product.name ?? cart.name,
        sku: product.sku ?? cart.sku,
        salePrice,
        ...(typeof product.basePrice === 'number' ? { basePrice: product.basePrice } : {}),
        quantity,
        ...(cart.image ? { image: cart.image } : {}),
        inventory,
      });
    }
    return ok(priced);
  },

  /**
   * Prices a project advance/balance payment from the project's agreed price
   * (finalPrice/quotedPrice — written by admins/server only). The browser's items
   * are ignored: they used to carry a client-computed per-part spread.
   */
  async priceProjectPayment(
    input: Pick<OrderCreateInput, 'projectId' | 'isAdvance' | 'isBalance'>,
    userId: string,
    shippingOption: ShippingOption
  ): Promise<Result<PricedOrder, AppError>> {
    const projectResult = await ProjectRepository.getProjectRfqById(input.projectId as string);
    if (!projectResult.success) return err(validationError('Project not found'));
    const project = projectResult.data as any;

    if (project.userId !== userId) {
      logger.warn({ event: 'CheckoutService: Project payment by non-owner', projectId: input.projectId, userId });
      return err(validationError('Project not found'));
    }

    const agreed = Number(project.finalPrice || project.quotedPrice || 0);
    if (!Number.isFinite(agreed) || agreed <= 0) {
      return err(validationError('This project has no agreed price yet.'));
    }

    if (input.isBalance) {
      if (!['shipped', 'shipping', 'delivered'].includes(project.status)) {
        return err(validationError('Balance payment is available once the order has shipped.'));
      }
      if (project.paymentStatus?.completion?.paid) return err(validationError('Balance already paid.'));
    } else {
      if (project.status !== 'accepted') {
        return err(validationError('Advance payment is available after you accept the quotation.'));
      }
      if (project.paymentStatus?.advance?.paid) return err(validationError('Advance already paid.'));
    }

    const finances = calculateProjectFinances(agreed, shippingOption.price);
    const total = input.isBalance ? finances.balance : finances.advance;
    return ok({ items: [], shopItems: [], shippingOption, subtotal: agreed, finances, total });
  },

  /**
   * Prices an order from server-side data: saved quotes, the product catalogue, the shipping registry,
   * and the shared finance rules. Used for both the Razorpay amount and the order record.
   */
  async priceOrder(
    input: Pick<
      OrderCreateInput,
      | 'items'
      | 'shopItems'
      | 'shippingOptionId'
      | 'projectId'
      | 'isAdvance'
      | 'isBalance'
      | 'advancePercentage'
    >,
    userId?: string
  ): Promise<Result<PricedOrder, AppError>> {
    const shippingOption = SHIPPING_OPTIONS.find((o) => o.id === input.shippingOptionId);
    if (!shippingOption) return err(validationError('Invalid shipping option selected'));

    if (input.projectId) {
      if (!userId) return err(validationError('Project payments require a signed-in owner'));
      return CheckoutService.priceProjectPayment(input, userId, shippingOption);
    }

    const itemsResult = await CheckoutService.resolveCartQuotes(input.items ?? []);
    if (!itemsResult.success) return err(itemsResult.error);
    const items = itemsResult.data;

    const shopResult = await CheckoutService.resolveShopItems(input.shopItems ?? []);
    if (!shopResult.success) return err(shopResult.error);
    const shopItems = shopResult.data;

    const quoteSubtotal = items.reduce((sum, item) => sum + item.quote.totalPrice, 0);
    const shopSubtotal = shopItems.reduce((sum, item) => sum + item.salePrice * item.quantity, 0);
    const subtotal = quoteSubtotal + shopSubtotal;

    const finances = calculateProjectFinances(subtotal, shippingOption.price);
    let total = finances.total;
    if (input.isAdvance) {
      total = finances.advance;
    } else if (input.isBalance) {
      total = finances.balance;
    } else if (input.projectId && input.advancePercentage) {
      // Custom advance percentage for project payments
      total = Math.round(total * input.advancePercentage);
    }

    return ok({ items, shopItems, shippingOption, subtotal, finances, total });
  },

  /**
   * Creates a multi-part order from a cart with validation.
   * Quote prices are re-validated against the saved quotes, never taken from the cart.
   */
  async createOrder(input: CreateOrderInput): Promise<Result<QuoteOrder, AppError>> {
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

      const { shippingAddress, projectId, isAdvance, isBalance, advancePercentage, userId } =
        validation.data;

      // 2. Price from saved quotes + shipping registry (also checks DFM and expiry)
      const priced = await CheckoutService.priceOrder(validation.data, userId);
      if (!priced.success) return err(priced.error);
      const { items, shopItems, shippingOption, subtotal, finances, total } = priced.data;

      // 3. Build Order Object
      const orderId = `order_${nanoid(12)}`;
      const orderNumber = `MH-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;

      const order: QuoteOrder = {
        id: orderId,
        orderNumber,
        userId,
        items,
        shopItems,
        shippingAddress: shippingAddress as ShippingAddress,
        shippingOption,
        subtotal,
        gst: finances.gst,
        shippingCost: finances.shipping,
        total,
        status: 'quoted',
        paymentStatus: 'pending',
        razorpayOrderId: input.razorpayOrderId,
        projectId,
        isAdvance,
        isBalance,
        advancePercentage,
        createdAt: new Date().toISOString(),
      };

      // 4. Persistence
      const saveResult = await OrderRepository.saveOrder(order);
      if (!saveResult.success) return err(saveResult.error);

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
