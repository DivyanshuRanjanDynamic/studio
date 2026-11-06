'use client';

import React from 'react';
import { useForm, type FieldError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Buildings, MapPin, WarningCircle } from '@phosphor-icons/react/dist/ssr';
import { shippingAddressSchema } from '@/validators/order.validator';
import type { ShippingAddress } from '@/models/order.model';
import { fieldClass } from '@/components/auth/AuthShell';
import { buttonClass } from '@/components/home/button';
import { cn } from '@/utils';

interface ShippingFormProps {
  onSubmit: (data: ShippingAddress) => void;
  defaultValues?: Partial<ShippingAddress>;
  isLoading?: boolean;
}

function Field({
  id,
  label,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: FieldError;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="title-4">
        {label}
      </label>
      {children}
      {error?.message && (
        <p id={`${id}-error`} className="caption-2 flex items-center gap-2 text-lp-destructive">
          <WarningCircle aria-hidden="true" className="size-4 shrink-0" weight="bold" />
          {error.message}
        </p>
      )}
    </div>
  );
}

/**
 * ShippingForm — India specific address form with pincode and GST validation.
 * Uses Zod for strict validation against MechHub rules.
 */
export function ShippingForm({ onSubmit, defaultValues, isLoading }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ShippingAddress>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      isGstInvoicing: false,
      ...defaultValues,
    },
  });

  const isGstSelected = watch('isGstInvoicing');
  const a11y = (name: keyof ShippingAddress, id: string) => ({
    id,
    'aria-invalid': !!errors[name],
    'aria-describedby': errors[name] ? `${id}-error` : undefined,
    className: fieldClass(!!errors[name]),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <section aria-labelledby="ship-heading" className="rounded-2xl border border-lp-border bg-lp-bg p-6 md:p-8">
        <h2 id="ship-heading" className="heading-6 flex items-center gap-2">
          <MapPin aria-hidden="true" className="size-5 text-lp-primary" weight="duotone" />
          Where should we deliver?
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field id="ship-name" label="Full name" error={errors.fullName}>
            <input {...register('fullName')} {...a11y('fullName', 'ship-name')} autoComplete="name" placeholder="Who receives the parts" />
          </Field>
          <Field id="ship-phone" label="Phone number" error={errors.phone}>
            <input {...register('phone')} {...a11y('phone', 'ship-phone')} type="tel" autoComplete="tel" inputMode="numeric" placeholder="10 digit mobile" />
          </Field>
          <Field id="ship-line1" label="Address" error={errors.addressLine1} className="md:col-span-2">
            <input {...register('addressLine1')} {...a11y('addressLine1', 'ship-line1')} autoComplete="address-line1" placeholder="Building, street, area" />
          </Field>
          <Field id="ship-line2" label="Landmark (optional)" error={errors.addressLine2} className="md:col-span-2">
            <input {...register('addressLine2')} {...a11y('addressLine2', 'ship-line2')} autoComplete="address-line2" placeholder="Near…" />
          </Field>
          <Field id="ship-city" label="City" error={errors.city}>
            <input {...register('city')} {...a11y('city', 'ship-city')} autoComplete="address-level2" placeholder="Coimbatore" />
          </Field>
          <Field id="ship-state" label="State" error={errors.state}>
            <input {...register('state')} {...a11y('state', 'ship-state')} autoComplete="address-level1" placeholder="Tamil Nadu" />
          </Field>
          <Field id="ship-pin" label="Pincode" error={errors.pincode}>
            <input {...register('pincode')} {...a11y('pincode', 'ship-pin')} autoComplete="postal-code" inputMode="numeric" placeholder="6 digit PIN" />
          </Field>
        </div>
      </section>

      <section aria-labelledby="gst-heading" className="rounded-2xl border border-lp-border bg-lp-bg p-6 md:p-8">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" {...register('isGstInvoicing')} className="mt-1 size-4 cursor-pointer rounded accent-lp-primary" />
          <span>
            <span id="gst-heading" className="title-3 flex items-center gap-2">
              <Buildings aria-hidden="true" className="size-5 text-lp-primary" weight="duotone" />
              Business order with GST invoice
            </span>
            <span className="caption-2 text-lp-muted-fg">Add your GSTIN to claim input tax credit.</span>
          </span>
        </label>

        {isGstSelected && (
          <div className="lp-faq-body mt-6 grid gap-4 border-t border-lp-border pt-6 md:grid-cols-2">
            <Field id="ship-gst" label="GST number" error={errors.gstNumber}>
              <input {...register('gstNumber')} {...a11y('gstNumber', 'ship-gst')} placeholder="29AAAAA0000A1Z5" className={cn(fieldClass(!!errors.gstNumber), 'uppercase')} />
            </Field>
            <Field id="ship-company" label="Company name" error={errors.companyName}>
              <input {...register('companyName')} {...a11y('companyName', 'ship-company')} autoComplete="organization" placeholder="Legal business name" />
            </Field>
          </div>
        )}
      </section>

      <button type="submit" disabled={isLoading} aria-busy={isLoading} className={cn(buttonClass('primary', 'md', true), 'w-full justify-between py-2 disabled:opacity-60')}>
        {isLoading ? 'Saving delivery details' : 'Continue to payment'}
        <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-lp-primary-fg/15">
          <ArrowRight className="size-4" weight="bold" />
        </span>
      </button>
    </form>
  );
}
