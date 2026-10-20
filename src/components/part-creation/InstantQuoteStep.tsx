'use client';

import { AlertCircle, AlertTriangle, Clock, Cog, Loader2, RefreshCw, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CNC_PROCESS_LABELS } from '@/lib/quoting/cnc-materials';
import { getFinishRate } from '@/lib/quoting/materials';
import type { CncQuoteResult } from '@/types/quoting';
import type { SecondaryProcess } from '@/models/project.model';
import type { WizardAnalysisStatus } from '@/hooks/use-wizard-cnc-analysis';

// ═══════════════════════════════════════════════════
// InstantQuoteStep — what this part costs to manufacture, before it's added
// The figure shown is the same engine the server uses when the part is added.
// ═══════════════════════════════════════════════════

const inr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const PROCESS_LABELS: Partial<Record<SecondaryProcess, string>> = {
  heat_treatment: 'Heat treatment',
  sand_blasting: 'Sand blasting',
  powder_coating: 'Powder coating',
  anodizing: 'Anodizing',
  chrome_plating: 'Chrome plating',
  nickel_plating: 'Nickel plating',
  zinc_plating: 'Zinc plating',
};

interface InstantQuoteStepProps {
  isCnc: boolean;
  analysisStatus: WizardAnalysisStatus;
  analysisError: string | null;
  onRetryAnalysis: () => void;
  quote: CncQuoteResult | null;
  /** Why there's no instant price (material/geometry the engine can't price) */
  unavailableReason: string | null;
  unpricedProcesses: readonly SecondaryProcess[];
  quantity: number;
  partName: string;
}

export function InstantQuoteStep({
  isCnc,
  analysisStatus,
  analysisError,
  onRetryAnalysis,
  quote,
  unavailableReason,
  unpricedProcesses,
  quantity,
  partName,
}: InstantQuoteStepProps) {
  if (!isCnc) {
    return (
      <ManualQuoteNotice
        title="Engineer-priced service"
        message="Instant pricing covers CNC machining. Add this part and our engineers will price it when you send the RFQ."
      />
    );
  }

  if (analysisStatus === 'analyzing') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-[#2F5FA7] animate-spin" />
        <p className="text-[10px] font-black text-[#2F5FA7] uppercase tracking-widest">
          Calculating machining time, stock and setups…
        </p>
      </div>
    );
  }

  if (analysisStatus === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-red-700">{analysisError ?? 'CNC analysis failed.'}</p>
        </div>
        <Button variant="outline" onClick={onRetryAnalysis} className="w-full rounded-xl gap-2">
          <RefreshCw className="w-4 h-4" /> Retry analysis
        </Button>
        <p className="text-[10px] text-slate-400 font-medium">
          You can still add the part — an engineer will price it from your file.
        </p>
      </div>
    );
  }

  if (!quote) {
    return (
      <ManualQuoteNotice
        title="Priced by an engineer"
        message={`${unavailableReason ?? 'This part needs an engineer’s review.'} You can still add it to the project.`}
      />
    );
  }

  const b = quote.breakdown;
  const rows: Array<[string, number]> = [
    ['Material (stock)', b.materialCost],
    ['Machining', b.machiningCost],
    ['Setup', b.setupCost],
    ['Programming', b.programmingCost],
    ...(b.tappingCost ? ([[`Tapping (${b.tappedHoles} holes)`, b.tappingCost]] as Array<[string, number]>) : []),
    ...(b.finishCost ? ([[getFinishRate(quote.parameters.finishType).label, b.finishCost]] as Array<[string, number]>) : []),
  ];
  const blocking = quote.dfmIssues.filter((i) => i.blocking);
  const warnings = quote.dfmIssues.filter((i) => !i.blocking);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#2F5FA7]" />
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Instant Quote</h3>
      </div>

      <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mb-1 truncate">
          {partName || 'This part'} · {quantity} pcs
        </p>
        <p className="text-4xl font-black tracking-tight" data-testid="instant-quote-total">
          {inr(quote.totalPrice)}
        </p>
        <p className="text-xs font-bold text-blue-100 mt-1">
          {inr(quote.pricePerPart)} per part · excl. GST &amp; shipping
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat icon={<Cog className="w-3.5 h-3.5" />} label="Process" value={CNC_PROCESS_LABELS[quote.process]} />
        <Stat
          icon={<Clock className="w-3.5 h-3.5" />}
          label="Lead time"
          value={`${quote.leadTimeDays} day${quote.leadTimeDays === 1 ? '' : 's'}`}
        />
        <Stat icon={<Wrench className="w-3.5 h-3.5" />} label="Cycle time" value={`${b.cycleTimeMin.toFixed(1)} min/part`} />
        <Stat icon={<Cog className="w-3.5 h-3.5" />} label="Setups" value={`${quote.analysis.setups.count}`} />
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cost per part</p>
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="font-bold text-slate-500">{label}</span>
            <span className="font-mono font-bold text-slate-900">{inr(value)}</span>
          </div>
        ))}
        <p className="text-[10px] text-slate-400 font-medium pt-1">
          Includes shop margin. Setup and programming are spread across {quantity} pcs.
        </p>
      </div>

      {unpricedProcesses.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-amber-700">
            Not included: {unpricedProcesses.map((p) => PROCESS_LABELS[p] ?? p).join(', ')}. Our engineers add these
            when they review your RFQ.
          </p>
        </div>
      )}

      {(blocking.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manufacturability</p>
          {[...blocking, ...warnings].map((issue, idx) => (
            <div
              key={`${issue.code}-${idx}`}
              className={`p-3 rounded-xl border text-[11px] font-bold ${
                issue.blocking ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
        Instant prices are estimates from your part&apos;s geometry. The final price is confirmed in the quotation you
        receive after sending the RFQ.
      </p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="text-xs font-black text-slate-900 mt-1">{value}</p>
    </div>
  );
}

function ManualQuoteNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-3 py-6">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-[#2F5FA7]" />
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      </div>
      <p className="text-xs font-medium text-slate-500 leading-relaxed">{message}</p>
    </div>
  );
}
