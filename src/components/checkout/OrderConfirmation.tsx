'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarBlank, Check, House, Package } from '@phosphor-icons/react/dist/ssr';
import { format, addDays } from 'date-fns';
import type { QuoteOrder } from '@/models/order.model';
import { Accent, Tag } from '@/components/home/primitives';
import { buttonClass } from '@/components/home/button';
import { cn } from '@/utils';

interface OrderConfirmationProps {
  order: QuoteOrder;
}

const NEXT = ['Payment confirmed', 'MechMaster assigned', 'In production', 'Quality checked', 'Shipped'];

/** OrderConfirmation — shown after payment: order summary and what happens next. */
export function OrderConfirmation({ order }: OrderConfirmationProps) {
  const estimatedDelivery = order.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate)
    : addDays(new Date(), order.shippingOption.estimatedDays + 2);
  const itemCount = (order.items?.length || 0) + (order.shopItems?.length || 0);

  return (
    <div className="lp-hero-in mx-auto max-w-[680px] pt-8 md:pt-16">
      <div className="text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-lp-primary text-lp-primary-fg">
          <Check aria-hidden="true" className="size-8" weight="bold" />
        </span>
        <div className="mt-6">
          <Tag>Order placed</Tag>
        </div>
        <h1 className="heading-3 mt-4">
          Your order is <Accent>confirmed</Accent>
        </h1>
        <p className="body-6 mt-2 text-lp-muted-fg">
          Order <span className="lp-num body-4 text-lp-fg">#{order.orderNumber}</span> is paid and confirmed. You can follow
          every stage from your dashboard.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-lp-border bg-lp-bg p-6 md:p-8">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="flex gap-3">
            <CalendarBlank aria-hidden="true" className="size-5 shrink-0 text-lp-primary" weight="duotone" />
            <div>
              <dt className="lp-mono text-lp-muted-fg">Estimated delivery</dt>
              <dd className="title-4 mt-1">{format(estimatedDelivery, 'EEE, d MMM yyyy')}</dd>
            </div>
          </div>
          <div className="flex gap-3">
            <Package aria-hidden="true" className="size-5 shrink-0 text-lp-primary" weight="duotone" />
            <div>
              <dt className="lp-mono text-lp-muted-fg">Items</dt>
              <dd className="title-4 mt-1">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </dd>
            </div>
          </div>
          <div className="flex gap-3 sm:col-span-2">
            <House aria-hidden="true" className="size-5 shrink-0 text-lp-primary" weight="duotone" />
            <div>
              <dt className="lp-mono text-lp-muted-fg">Delivering to</dt>
              <dd className="body-6 mt-1">
                <span className="title-4 block">{order.shippingAddress.fullName}</span>
                <span className="text-lp-muted-fg">
                  {order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.pincode}
                </span>
              </dd>
            </div>
          </div>
        </dl>

        <div className="mt-8 border-t border-lp-border pt-6">
          <p className="lp-mono text-lp-muted-fg">What happens next</p>
          <ol className="mt-4 flex flex-wrap gap-2">
            {NEXT.map((s, i) => (
              <li key={s} className={cn('caption-4 flex items-center gap-2 rounded-full border px-3 py-1', i === 0 ? 'border-lp-primary bg-lp-primary/10 text-lp-primary' : 'border-lp-border text-lp-muted-fg')}>
                {i === 0 && <Check aria-hidden="true" className="size-3" weight="bold" />}
                {s}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link href="/dashboard" className={cn(buttonClass('primary'), 'flex-1 py-3')}>
          Track it in your dashboard
          <ArrowRight aria-hidden="true" className="size-4" weight="bold" />
        </Link>
        <Link href="/orders" className={cn(buttonClass('secondary'), 'flex-1 py-3')}>
          Order details
        </Link>
      </div>
    </div>
  );
}
