'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cog,
  Download,
  Loader2,
  ReceiptText,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { MechanicalPart } from '@/models/project.model';
import { summarizeProjectCost, type PartPriceStatus } from '@/lib/quoting/project-costing';
import { CNC_PROCESS_LABELS } from '@/lib/quoting/cnc-materials';
import { getFinishRate } from '@/lib/quoting/materials';

// ═══════════════════════════════════════════════════
// RfqInstantCosts — admin view of what the instant engine priced this RFQ at
//
// Gives the admin the per-part engine prices, cost breakdowns, DFM flags and the
// project total as the starting point for the official quote, plus the quotation
// PDF. "Apply instant prices" fills the pricing worksheet with the engine's numbers.
// ═══════════════════════════════════════════════════

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const STATUS_BADGE: Record<PartPriceStatus, { label: string; className: string }> = {
  quoted: { label: 'You quoted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  instant: { label: 'Instant', className: 'bg-blue-50 text-[#2F5FA7] border-blue-200' },
  expired: { label: 'Instant (stale)', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending: { label: 'Needs pricing', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

interface RfqInstantCostsProps {
  parts: MechanicalPart[];
  project: { id: string; status?: string; quotedPrice?: number; finalPrice?: number };
  /** Fills the pricing worksheet with the engine's per-part prices */
  onApplyInstantPrices: (pricePerPartById: Record<string, string>) => void;
}

export function RfqInstantCosts({ parts, project, onApplyInstantPrices }: RfqInstantCostsProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const summary = useMemo(() => summarizeProjectCost(parts), [parts]);

  const applyablePrices = useMemo(() => {
    const byId: Record<string, string> = {};
    for (const part of parts) {
      const p = part.instantQuote?.pricePerPart;
      if (typeof p === 'number' && p > 0) byId[part.id] = String(p);
    }
    return byId;
  }, [parts]);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/quotation`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not generate the quotation');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const match = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/);
      const a = document.createElement('a');
      a.href = url;
      a.download = match?.[1] || `quotation-${project.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: 'Download failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (parts.length === 0) return null;

  return (
    <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50/30 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between gap-3 flex-wrap">
        <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em]">
          <Sparkles className="w-3.5 h-3.5" /> Instant Cost Engine
        </h3>
        <div className="flex items-center gap-2">
          {Object.keys(applyablePrices).length > 0 && (
            <Button
              size="sm"
              onClick={() => onApplyInstantPrices(applyablePrices)}
              className="h-7 bg-white/15 hover:bg-white/25 text-white text-[9px] font-bold uppercase tracking-widest border border-white/20"
            >
              <Wand2 className="w-3 h-3 mr-1.5" /> Apply instant prices
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="h-7 bg-white text-[#2F5FA7] hover:bg-blue-50 text-[9px] font-bold uppercase tracking-widest"
          >
            {isDownloading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Download className="w-3 h-3 mr-1.5" />}
            Quotation PDF
          </Button>
        </div>
      </div>

      {/* Project totals from the instant engine */}
      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-blue-100 bg-white">
        <Metric label="Parts subtotal" value={inr(summary.partsSubtotal)} />
        <Metric label="GST (18%)" value={inr(summary.finances.gst)} />
        <Metric label="Grand total" value={inr(summary.finances.total)} strong />
        <Metric
          label="Priced / total"
          value={`${summary.pricedPartCount} / ${summary.partCount}`}
          hint={summary.pendingPartCount > 0 ? `${summary.pendingPartCount} need pricing` : undefined}
        />
      </div>

      {/* Per-part engine breakdown */}
      <div className="p-4 space-y-3">
        {parts.map((part, idx) => {
          const line = summary.lines[idx];
          const q = part.instantQuote;
          const meta = STATUS_BADGE[line.status];
          return (
            <div key={part.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="bg-[#2F5FA7] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">P{idx + 1}</span>
                  <span className="font-bold text-slate-900 text-xs truncate">{part.partName}</span>
                  <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0 h-4 ${meta.className}`}>
                    {meta.label}
                  </Badge>
                </div>
                <div className="text-right shrink-0">
                  {line.lineTotal !== null ? (
                    <>
                      <p className="text-sm font-black text-[#1E3A66] font-mono leading-none">{inr(line.lineTotal)}</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                        {inr(line.unitPrice ?? 0)} × {part.quantity}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Needs pricing</p>
                  )}
                </div>
              </div>

              {q ? (
                <div className="p-3 space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-slate-600">
                    <span className="flex items-center gap-1"><Cog className="w-3 h-3 text-[#2F5FA7]" /> {CNC_PROCESS_LABELS[q.process] ?? q.process}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#2F5FA7]" /> {q.leadTimeDays}d</span>
                    <span className="text-slate-400">{q.stock}</span>
                    <span className="text-slate-400">cycle {q.breakdown.cycleTimeMin?.toFixed?.(1) ?? '—'} min</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                    {([
                      ['Material', q.breakdown.materialCost],
                      ['Machining', q.breakdown.machiningCost],
                      ['Setup', q.breakdown.setupCost],
                      ['Programming', q.breakdown.programmingCost],
                      ...(q.breakdown.tappingCost ? [[`Tapping (${q.breakdown.tappedHoles})`, q.breakdown.tappingCost] as [string, number]] : []),
                      ...(q.breakdown.finishCost ? [[getFinishRate(q.finishType)?.label ?? 'Finish', q.breakdown.finishCost] as [string, number]] : []),
                    ] as [string, number][]).map(([label, value]) => (
                      <div key={label} className="flex justify-between text-[10px]">
                        <span className="text-slate-400 font-bold">{label}</span>
                        <span className="font-mono font-bold text-slate-700">{inr(value)}</span>
                      </div>
                    ))}
                  </div>
                  {q.unpricedProcesses.length > 0 && (
                    <p className="text-[10px] font-bold text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      Not priced by the engine: {q.unpricedProcesses.map((p) => p.replace(/_/g, ' ')).join(', ')}
                    </p>
                  )}
                  {q.dfmIssues.length > 0 && (
                    <div className="space-y-1">
                      {q.dfmIssues.map((issue, i) => (
                        <p
                          key={`${issue.code}-${i}`}
                          className={`text-[10px] font-bold flex items-start gap-1.5 ${issue.blocking ? 'text-red-600' : 'text-amber-700'}`}
                        >
                          {issue.blocking ? <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" />}
                          {issue.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 flex items-start gap-2">
                  <ReceiptText className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-slate-500">
                    {part.quoteNote || 'No instant price — our engine does not cover this part. Price it manually below.'}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, strong, hint }: { label: string; value: string; strong?: boolean; hint?: string }) {
  return (
    <div>
      <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={`font-mono font-black ${strong ? 'text-base text-[#1E3A66]' : 'text-xs text-slate-800'}`}>{value}</p>
      {hint && <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest">{hint}</p>}
    </div>
  );
}
