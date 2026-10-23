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
import type { MechanicalPart, PartInstantQuote } from '@/models/project.model';
import { summarizeProjectCost, type PartPriceStatus } from '@/lib/quoting/project-costing';
import { CNC_PROCESS_LABELS } from '@/lib/quoting/cnc-materials';
import { getFinishRate } from '@/lib/quoting/materials';

function quoteFacts(q: PartInstantQuote): { process: string; notes: string[]; rows: [string, number][] } {
  const finish = (cost: number): [string, number][] =>
    cost ? [[getFinishRate(q.finishType)?.label ?? 'Finish', cost]] : [];
  if (q.kind === 'sheet') {
    const b = q.breakdown;
    return {
      process: `Laser cut ${q.thicknessMm} mm`,
      notes: [`cut ${b.cutTimeMin.toFixed(1)} min`, b.bendCount ? `${b.bendCount} bends` : 'flat', `sheet use ${Math.round(b.sheetUtilisation * 100)}%`],
      rows: [
        ['Material', b.materialCost],
        ['Laser cutting', b.cutCost],
        ['Laser setup', b.laserSetupCost],
        ...(b.bendingCost ? [[`Bending (${b.bendCount})`, b.bendingCost] as [string, number]] : []),
        ...(b.tappingCost ? [[`Tapping (${b.tappedHoles})`, b.tappingCost] as [string, number]] : []),
        ...finish(b.finishCost),
      ],
    };
  }
  if (q.kind === 'print') {
    const b = q.breakdown;
    return {
      process: 'FDM 3D print',
      notes: [`${b.massG.toFixed(0)} g`, `print ${b.printTimeMin.toFixed(0)} min`, `${b.orientation} up`],
      rows: [
        ['Filament', b.materialCost],
        ['Printer time', b.machineCost],
        ['Post-processing', b.labourCost],
        ['Setup', b.setupCost],
        ...finish(b.finishCost),
      ],
    };
  }
  const b = q.breakdown;
  return {
    process: CNC_PROCESS_LABELS[q.process] ?? q.process,
    notes: [q.stock, `cycle ${b.cycleTimeMin?.toFixed?.(1) ?? '—'} min`],
    rows: [
      ['Material', b.materialCost],
      ['Machining', b.machiningCost],
      ['Setup', b.setupCost],
      ['Programming', b.programmingCost],
      ...(b.tappingCost ? [[`Tapping (${b.tappedHoles})`, b.tappingCost] as [string, number]] : []),
      ...finish(b.finishCost),
    ],
  };
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const STATUS_BADGE: Record<PartPriceStatus, { label: string; className: string }> = {
  quoted: { label: 'You quoted', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  instant: { label: 'Instant', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  expired: { label: 'Instant (stale)', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  pending: { label: 'Needs pricing', className: 'bg-neutral-100 text-neutral-500 border-neutral-200' },
};

interface RfqInstantCostsProps {
  parts: MechanicalPart[];
  project: { id: string; status?: string; quotedPrice?: number; finalPrice?: number };
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
    <div className="border border-lp-border bg-white overflow-hidden">
      <div className="px-4 py-3 bg-lp-ink text-lp-ink-fg flex items-center justify-between gap-3 flex-wrap">
        <h3 className="flex items-center gap-2 adm-mono">
          <Sparkles className="w-3.5 h-3.5 text-[oklch(72%_0.14_264)]" /> Instant Cost Engine
        </h3>
        <div className="flex items-center gap-2">
          {Object.keys(applyablePrices).length > 0 && (
            <Button
              size="sm"
              onClick={() => onApplyInstantPrices(applyablePrices)}
              className="h-7 bg-white/10 hover:bg-white/20 text-white text-[9px] font-semibold uppercase tracking-widest border border-white/20 rounded-none transition-colors"
            >
              <Wand2 className="w-3 h-3 mr-1.5" /> Apply instant prices
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="h-7 bg-white text-lp-fg hover:bg-lp-primary hover:text-white text-[9px] font-semibold uppercase tracking-widest rounded-none transition-colors font-lp-mono"
          >
            {isDownloading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Download className="w-3 h-3 mr-1.5" />}
            Quotation PDF
          </Button>
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-lp-border bg-lp-bg">
        <Metric label="Parts subtotal" value={inr(summary.partsSubtotal)} />
        <Metric label="GST (18%)" value={inr(summary.finances.gst)} />
        <Metric label="Grand total" value={inr(summary.finances.total)} strong />
        <Metric
          label="Priced / total"
          value={`${summary.pricedPartCount} / ${summary.partCount}`}
          hint={summary.pendingPartCount > 0 ? `${summary.pendingPartCount} need pricing` : undefined}
        />
      </div>

      <div className="p-4 space-y-3">
        {parts.map((part, idx) => {
          const line = summary.lines[idx];
          const q = part.instantQuote;
          const meta = STATUS_BADGE[line.status];
          return (
            <div key={part.id} className="adm-row border border-lp-border bg-white overflow-hidden">
              <div className="px-3 py-2.5 bg-lp-bg border-b border-lp-border flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="bg-lp-ink text-lp-ink-fg text-[9px] font-lp-mono px-1.5 py-0.5">P{idx + 1}</span>
                  <span className="adm-row-title text-xs truncate">{part.partName}</span>
                  <Badge variant="outline" className={`text-[9px] font-medium uppercase tracking-wider px-1.5 py-0 h-4 ${meta.className}`}>
                    {meta.label}
                  </Badge>
                </div>
                <div className="text-right shrink-0">
                  {line.lineTotal !== null ? (
                    <>
                      <p className="text-sm font-bold text-lp-fg font-lp-mono leading-none">{inr(line.lineTotal)}</p>
                      <p className="text-[9px] text-lp-muted-fg font-medium uppercase tracking-wider mt-0.5">
                        {inr(line.unitPrice ?? 0)} × {part.quantity}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] font-medium uppercase tracking-wider text-lp-muted-fg">Needs pricing</p>
                  )}
                </div>
              </div>

              {q ? (
                <div className="p-3 space-y-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-medium text-lp-fg/80">
                    <span className="flex items-center gap-1"><Cog className="w-3 h-3 text-lp-primary" /> {quoteFacts(q).process}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-lp-primary" /> {q.leadTimeDays}d</span>
                    {quoteFacts(q).notes.map((note) => (
                      <span key={note} className="text-lp-muted-fg">{note}</span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                    {quoteFacts(q).rows.map(([label, value]) => (
                      <div key={label} className="flex justify-between text-[10px]">
                        <span className="text-lp-muted-fg font-medium">{label}</span>
                        <span className="font-lp-mono font-semibold text-lp-fg">{inr(value)}</span>
                      </div>
                    ))}
                  </div>
                  {q.unpricedProcesses.length > 0 && (
                    <p className="text-[10px] font-medium text-amber-700 flex items-start gap-1.5">
                      <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                      Not priced by the engine: {q.unpricedProcesses.map((p) => p.replace(/_/g, ' ')).join(', ')}
                    </p>
                  )}
                  {q.dfmIssues.length > 0 && (
                    <div className="space-y-1">
                      {q.dfmIssues.map((issue, i) => (
                        <p
                          key={`${issue.code}-${i}`}
                          className={`text-[10px] font-medium flex items-start gap-1.5 ${issue.blocking ? 'text-red-600' : 'text-amber-700'}`}
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
                  <ReceiptText className="w-3.5 h-3.5 text-lp-muted-fg shrink-0 mt-0.5" />
                  <p className="text-[10px] font-medium text-lp-muted-fg">
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
      <p className="text-[9px] font-semibold uppercase tracking-wider text-lp-muted-fg">{label}</p>
      <p className={`font-lp-mono font-bold ${strong ? 'text-base text-lp-fg' : 'text-xs text-lp-fg'}`}>{value}</p>
      {hint && <p className="text-[9px] font-medium text-amber-600 uppercase tracking-wider">{hint}</p>}
    </div>
  );
}
