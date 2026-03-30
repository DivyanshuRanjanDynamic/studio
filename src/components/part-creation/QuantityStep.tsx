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
}

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
}: QuantityStepProps) {
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
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold uppercase tracking-wide text-slate-900 mb-2">
          Quantity & Review
        </h3>
        <p className="text-xs uppercase tracking-widest font-bold text-slate-500">
          Specify the quantity and review your part configuration
        </p>
      </div>

      {/* Quantity Input */}
      <Card className="bg-blue-50 border-[#2F5FA7]/20 p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-4">
            <div className="w-full sm:w-auto flex items-center gap-3 justify-center sm:justify-start">
              <div className="w-10 h-10 hidden sm:flex rounded-xl bg-[#2F5FA7] items-center justify-center">
                <Hash className="w-5 h-5  text-white" />
              </div>
              <div className="pb-1 text-center sm:text-left">
                <Label
                  htmlFor="quantity"
                  className="text-[10px] uppercase text-[#2F5FA7] font-bold tracking-widest"
                >
                  Required Quantity
                </Label>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  No minimum quantity required
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center gap-4 justify-center">
              <Input
                id="quantity"
                type="number"
                min={1}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className="w-14 sm:w-[10vw] md:w-40 h-14 text-2xl font-bold text-center uppercase tracking-wider text-slate-900 bg-white border-slate-200"
              />
              <div className="text-center">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">PCS</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      {/* Summary Card */}
      <Card className="bg-slate-900 border-slate-800 p-5">
        <div className="flex items-center gap-3 mb-3">
          <Calculator className="w-5 h-5 text-[#2F5FA7]" />
          <p className="text-xs text-white uppercase tracking-wider font-bold">Order Summary</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400 uppercase tracking-wider font-bold">Quantity:</span>
            <span className="text-white font-bold font-mono">{quantity} PCS</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-400 uppercase tracking-wider font-bold">
              Est. Per Part:
            </span>
            <span className="text-white font-bold font-mono">To be quoted</span>
          </div>
          <div className="border-t border-slate-700 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                Status:
              </span>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[8px] uppercase tracking-wider font-bold">
                Ready to Add
              </Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
