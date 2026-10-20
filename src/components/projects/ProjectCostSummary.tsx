'use client';

import { useMemo } from 'react';
import { AlertTriangle, Clock, Receipt, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MechanicalPart } from '@/models/project.model';
import {
  summarizeProjectCost,
  type PartPriceStatus,
  type ProjectCostSummary as CostSummary,
} from '@/lib/quoting/project-costing';
import { calculateProjectFinances } from '@/utils/finance';

// ═══════════════════════════════════════════════════
// ProjectCostSummary — per-part costs + subtotal, GST, shipping, grand total
// Numbers come from summarizeProjectCost (shared with the RFQ email and PDF).
// ═══════════════════════════════════════════════════

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const STATUS_META: Record<PartPriceStatus, { label: string; className: string }> = {
  quoted: { label: 'Quoted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  instant: { label: 'Instant', className: 'bg-blue-50 text-[#2F5FA7] border-blue-200' },
  expired: { label: 'Re-quote', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending: { label: 'Engineer', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

interface ProjectCostSummaryProps {
  parts: readonly MechanicalPart[];
  /** Admin-agreed total, once a quotation is sent — overrides the rolled-up subtotal */
  agreedSubtotal?: number | null;
  shippingCost?: number;
  className?: string;
}

export function ProjectCostSummary({ parts, agreedSubtotal, shippingCost, className }: ProjectCostSummaryProps) {
  const summary: CostSummary = useMemo(
    () => summarizeProjectCost(parts, { shippingCost }),
    [parts, shippingCost]
  );

  // Once an engineer sends the official quote, it is the figure of record.
  const useAgreed = typeof agreedSubtotal === 'number' && agreedSubtotal > 0;
  const subtotal = useAgreed ? (agreedSubtotal as number) : summary.partsSubtotal;
  const f = useAgreed ? calculateProjectFinances(subtotal, shippingCost) : summary.finances;

  if (summary.partCount === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Add parts to see your project cost
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="border-b border-slate-50">
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
          <Receipt className="w-4 h-4 text-[#2F5FA7]" /> Project Cost
          {!useAgreed && (
            <Badge variant="outline" className="ml-auto text-[8px] font-black border-blue-200 text-[#2F5FA7] uppercase tracking-widest">
              Instant estimate
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Per-part lines */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-slate-100 bg-slate-50/50">
                <th className="px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[9px]">Part</th>
                <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[9px] text-center">Qty</th>
                <th className="px-3 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[9px] text-right">Unit</th>
                <th className="px-5 py-2.5 font-bold text-slate-500 uppercase tracking-wider text-[9px] text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.lines.map((line) => {
                const meta = STATUS_META[line.status];
                return (
                  <tr key={line.partId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 leading-tight truncate max-w-[160px]">{line.partName}</p>
                        <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0 h-4 ${meta.className}`}>
                          {meta.label}
                        </Badge>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{line.materialName}</p>
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-600">{line.quantity}</td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-slate-500">
                      {line.unitPrice !== null ? inr(line.unitPrice) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                      {line.lineTotal !== null ? inr(line.lineTotal) : 'TBD'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Notices */}
        {(summary.pendingPartCount > 0 || summary.hasExpired) && (
          <div className="px-5 pt-4 space-y-2">
            {summary.pendingPartCount > 0 && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Wrench className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-slate-600">
                  {summary.pendingPartCount} part{summary.pendingPartCount === 1 ? '' : 's'} will be priced by our
                  engineers when you send the RFQ. The total below covers the instantly-priced parts only.
                </p>
              </div>
            )}
            {summary.hasExpired && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] font-bold text-amber-700">
                  {summary.expiredPartCount} instant price{summary.expiredPartCount === 1 ? '' : 's'} may be out of date.
                  Re-open the part to refresh it.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Totals */}
        <div className="p-5 space-y-2.5">
          <Row label={useAgreed ? 'Quoted subtotal' : 'Parts subtotal'} value={inr(subtotal)} />
          <Row label="GST (18%)" value={inr(f.gst)} />
          <Row label="Shipping" value={inr(f.shipping)} />
          <div className="h-px bg-slate-100 my-1" />
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">Grand Total</span>
            <span className="text-xl font-black text-[#1E3A66] font-mono" data-testid="project-grand-total">
              {inr(f.total)}
            </span>
          </div>
          {summary.maxLeadTimeDays > 0 && (
            <div className="flex items-center gap-2 pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              <Clock className="w-3 h-3" /> Est. lead time up to {summary.maxLeadTimeDays} days
            </div>
          )}
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed pt-1">
            {useAgreed
              ? 'This is your official quotation. Advance and balance are split 50/50.'
              : 'Instant estimate before engineering review. Final pricing is confirmed in your quotation after you send the RFQ.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <span className="font-mono font-bold text-slate-900">{value}</span>
    </div>
  );
}

