'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Hash, Calculator, TrendingDown } from 'lucide-react';

interface QuantityStepProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onDiscountTierChange: (tier: string) => void;
  /** Real per-part prices at each quantity break (CNC instant pricing) */
  tierPrices?: ReadonlyArray<{ quantity: number; pricePerPart: number; savingsPercent: number }>;
  /** Live per-part price at the chosen quantity */
  livePricePerPart?: number | null;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const QUANTITY_BREAKS = [
  { qty: 1, discount: 'Base Price' },
  { qty: 5, discount: '5% Off' },
  { qty: 10, discount: '12% Off' },
  { qty: 25, discount: '18% Off' },
  { qty: 50, discount: '22% Off' },
  { qty: 100, discount: '25% Off' },
];

export function QuantityStep({
  quantity,
  onQuantityChange,
  onDiscountTierChange,
  tierPrices,
  livePricePerPart,
}: QuantityStepProps) {
  const hasRealTiers = !!tierPrices && tierPrices.length > 0;
  const [inputValue, setInputValue] = useState(quantity.toString());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1) {
      onQuantityChange(numValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 1) {
      setInputValue('1');
      onQuantityChange(1);
    }
  };

  const getCurrentDiscount = () => {
    for (let i = QUANTITY_BREAKS.length - 1; i >= 0; i--) {
      if (quantity >= QUANTITY_BREAKS[i].qty) {
        return QUANTITY_BREAKS[i].discount;
      }
    }
    return QUANTITY_BREAKS[0].discount;
  };

  useEffect(() => {
    onDiscountTierChange(getCurrentDiscount());
  }, [quantity, onDiscountTierChange]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-2xl text-lp-fg mb-1">
          Quantity & <span className="font-lp-serif italic text-lp-primary">review</span>
        </h3>
        <p className="lp-label-mono text-lp-muted-fg">
          Specify quantity and review your configuration
        </p>
      </div>

      {/* Quantity Input */}
      <Card className="bg-lp-accent border-lp-border p-6 rounded-sm">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-sm bg-lp-primary flex items-center justify-center">
              <Hash className="w-5 h-5 text-lp-primary-fg" />
            </div>
            <div>
              <Label
                htmlFor="quantity"
                className="lp-label-mono text-lp-primary"
              >
                Required Quantity
              </Label>
              <p className="text-xs text-lp-muted-fg mt-0.5">
                No minimum quantity required
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Input
              id="quantity"
              type="number"
              min={1}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleBlur}
              className="h-14 text-2xl font-bold text-center text-lp-fg bg-lp-card border-lp-border font-lp-mono"
            />
            <div className="text-center">
              <p className="lp-label-mono text-lp-muted-fg">PCS</p>
            </div>
          </div>

          {!hasRealTiers && quantity >= 5 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-sm">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              <p className="text-[10px] text-emerald-700 uppercase tracking-wider font-bold">
                Quantity Discount Applied: {getCurrentDiscount()}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Real price per part at each break (instant pricing) */}
      {hasRealTiers && (
        <div className="space-y-3">
          <p className="lp-label-mono text-lp-muted-fg">Price per part by quantity</p>
          <div className="grid grid-cols-3 gap-2">
            {tierPrices!.slice(0, 6).map((tier) => {
              const active = quantity >= tier.quantity;
              return (
                <button
                  type="button"
                  key={tier.quantity}
                  onClick={() => {
                    setInputValue(String(tier.quantity));
                    onQuantityChange(tier.quantity);
                  }}
                  className={`text-center p-3 rounded-sm border transition-all ${
                    active ? 'bg-lp-primary border-lp-primary text-lp-primary-fg' : 'bg-lp-card border-lp-border text-lp-fg'
                  }`}
                >
                  <p className="text-xs font-bold">{tier.quantity}+ pcs</p>
                  <p className={`text-[11px] font-lp-mono font-bold ${active ? 'text-lp-primary-fg' : 'text-lp-fg'}`}>
                    {inr(tier.pricePerPart)}
                  </p>
                  {tier.savingsPercent > 0 && (
                    <p className={`text-[9px] font-bold ${active ? 'text-lp-primary-fg/70' : 'text-emerald-600'}`}>
                      −{tier.savingsPercent}%
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Breaks Info */}
      {!hasRealTiers && (
      <div className="space-y-3">
        <p className="lp-label-mono text-lp-muted-fg">
          Volume Discount Tiers
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {QUANTITY_BREAKS.map((breakPoint) => (
            <div
              key={breakPoint.qty}
              className={`text-center p-3 rounded-sm border transition-all ${
                quantity >= breakPoint.qty
                  ? 'bg-lp-primary border-lp-primary text-lp-primary-fg'
                  : 'bg-lp-card border-lp-border text-lp-muted-fg'
              }`}
            >
              <p
                className={`text-xs font-bold ${quantity >= breakPoint.qty ? 'text-lp-primary-fg' : 'text-lp-fg'}`}
              >
                {breakPoint.qty}+
              </p>
              <p
                className={`text-[9px] uppercase tracking-wider font-bold ${quantity >= breakPoint.qty ? 'text-lp-primary-fg/70' : 'text-lp-muted-fg'}`}
              >
                {breakPoint.discount}
              </p>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Summary Card */}
      <Card className="bg-lp-ink border-lp-ink p-5 rounded-sm">
        <div className="flex items-center gap-3 mb-3">
          <Calculator className="w-5 h-5 text-lp-primary" />
          <p className="lp-label-mono text-lp-ink-fg">Order Summary</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-lp-ink-fg/70 uppercase tracking-wider font-bold">Quantity:</span>
            <span className="text-lp-ink-fg font-bold font-lp-mono">{quantity} PCS</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-lp-ink-fg/70 uppercase tracking-wider font-bold">
              Est. Per Part:
            </span>
            <span className="text-lp-ink-fg font-bold font-lp-mono">
              {livePricePerPart ? inr(livePricePerPart) : 'To be quoted'}
            </span>
          </div>
          <div className="border-t border-lp-ink-fg/20 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-lp-ink-fg/70 text-[10px] uppercase tracking-wider font-bold">
                Status:
              </span>
              <Badge className="bg-lp-primary/20 text-lp-primary border-lp-primary/30 text-[8px] uppercase tracking-wider font-bold">
                Ready to Add
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
