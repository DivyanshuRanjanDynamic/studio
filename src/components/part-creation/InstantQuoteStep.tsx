'use client';

import { AlertCircle, AlertTriangle, Box, Clock, Cog, Layers, Loader2, RefreshCw, Ruler, Scissors, Weight, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CNC_PROCESS_LABELS } from '@/lib/quoting/cnc-materials';
import { getFinishRate } from '@/lib/quoting/materials';
import { isPrintQuote, isSheetQuote, type WizardQuote, type WizardQuoteKind } from '@/lib/quoting/wizard-quote';
import type { SecondaryProcess } from '@/models/project.model';
import type { WizardAnalysisStatus } from '@/hooks/use-wizard-cnc-analysis';
import { ErrorCode } from '@/utils/errors';

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
  tapping: 'Tapping on holes we could not match to your model',
};

interface InstantQuoteStepProps {
  kind: WizardQuoteKind | null;
  analysisStatus: WizardAnalysisStatus;
  analysisError: string | null;
  analysisErrorCode?: ErrorCode | null;
  onRetryAnalysis: () => void;
  /** Re-run the part as CNC machining (keeps the upload) */
  onSwitchToCnc?: () => void;
  quote: WizardQuote | null;
  /** Why there's no instant price (material/geometry the engine can't price) */
  unavailableReason: string | null;
  unpricedProcesses: readonly SecondaryProcess[];
  quantity: number;
  partName: string;
}

const ANALYSING: Record<WizardQuoteKind, string> = {
  cnc: 'Calculating machining time, stock and setups…',
  sheet: 'Measuring the flat blank, laser path and bends…',
  print: 'Measuring volume, supports and print time…',
};

const minutes = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${Math.round(m % 60)} min` : `${m.toFixed(1)} min`);

/** Stats and cost rows for each kind of quote */
function quoteDetails(quote: WizardQuote): {
  stats: Array<[React.ReactNode, string, string]>;
  rows: Array<[string, number]>;
  amortised: string;
} {
  const lead = `${quote.leadTimeDays} day${quote.leadTimeDays === 1 ? '' : 's'}`;
  const finish = (cost: number) =>
    cost ? ([[getFinishRate(quote.parameters.finishType).label, cost]] as Array<[string, number]>) : [];

  if (isSheetQuote(quote)) {
    const b = quote.breakdown;
    return {
      stats: [
        [<Layers key="t" className="w-3.5 h-3.5" />, 'Sheet', `${quote.parameters.thicknessMm} mm`],
        [<Scissors key="c" className="w-3.5 h-3.5" />, 'Laser path', `${(quote.analysis.cutLengthMm / 1000).toFixed(2)} m · ${quote.analysis.pierces} pierces`],
        [<Ruler key="b" className="w-3.5 h-3.5" />, 'Bends', b.bendCount ? `${b.bendCount}` : 'Flat part'],
        [<Clock key="l" className="w-3.5 h-3.5" />, 'Lead time', lead],
      ],
      rows: [
        ['Material (sheet)', b.materialCost],
        ['Laser cutting', b.cutCost],
        ['Laser setup & nesting', b.laserSetupCost],
        ...(b.bendingCost ? ([[`Bending (${b.bendCount} bend${b.bendCount === 1 ? '' : 's'})`, b.bendingCost]] as Array<[string, number]>) : []),
        ...(b.tappingCost ? ([[`Tapping (${b.tappedHoles} holes)`, b.tappingCost]] as Array<[string, number]>) : []),
        ...finish(b.finishCost),
      ],
      amortised: `Setup and nesting are spread across ${quote.parameters.quantity} pcs.`,
    };
  }

  if (isPrintQuote(quote)) {
    const b = quote.breakdown;
    return {
      stats: [
        [<Weight key="m" className="w-3.5 h-3.5" />, 'Weight', `${b.massG.toFixed(0)} g`],
        [<Clock key="p" className="w-3.5 h-3.5" />, 'Print time', minutes(b.printTimeMin)],
        [<Box key="o" className="w-3.5 h-3.5" />, 'Orientation', `${b.orientation.toUpperCase()} up${b.supportVolumeMm3 ? ' · supports' : ''}`],
        [<Clock key="l" className="w-3.5 h-3.5" />, 'Lead time', lead],
      ],
      rows: [
        ['Filament', b.materialCost],
        ['Printer time', b.machineCost],
        ['Post-processing', b.labourCost],
        ['Slicing & plate setup', b.setupCost],
        ...finish(b.finishCost),
      ],
      amortised: `Slicing and plate setup are spread across ${quote.parameters.quantity} pcs.`,
    };
  }

  const b = quote.breakdown;
  return {
    stats: [
      [<Cog key="p" className="w-3.5 h-3.5" />, 'Process', CNC_PROCESS_LABELS[quote.process]],
      [<Clock key="l" className="w-3.5 h-3.5" />, 'Lead time', lead],
      [<Wrench key="c" className="w-3.5 h-3.5" />, 'Cycle time', `${b.cycleTimeMin.toFixed(1)} min/part`],
      [<Cog key="s" className="w-3.5 h-3.5" />, 'Setups', `${quote.analysis.setups.count}`],
    ],
    rows: [
      ['Material (stock)', b.materialCost],
      ['Machining', b.machiningCost],
      ['Setup', b.setupCost],
      ['Programming', b.programmingCost],
      ...(b.tappingCost ? ([[`Tapping (${b.tappedHoles} holes)`, b.tappingCost]] as Array<[string, number]>) : []),
      ...finish(b.finishCost),
    ],
    amortised: `Setup and programming are spread across ${quote.parameters.quantity} pcs.`,
  };
}

export function InstantQuoteStep({
  kind,
  analysisStatus,
  analysisError,
  analysisErrorCode,
  onRetryAnalysis,
  onSwitchToCnc,
  quote,
  unavailableReason,
  unpricedProcesses,
  quantity,
  partName,
}: InstantQuoteStepProps) {
  if (!kind) {
    return (
      <ManualQuoteNotice
        title="Engineer-priced service"
        message="Instant pricing covers CNC machining, sheet metal and 3D printing. Add this part and our engineers will price it when you send the RFQ."
      />
    );
  }

  if (analysisStatus === 'analyzing') {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <Loader2 className="w-8 h-8 text-lp-primary animate-spin" />
        <p className="lp-label-mono text-lp-primary">{ANALYSING[kind]}</p>
      </div>
    );
  }

  if (analysisStatus === 'error' && analysisErrorCode === ErrorCode.NOT_SHEET_METAL) {
    // Retrying can't help: the geometry itself isn't a flat sheet.
    return (
      <div className="space-y-4">
        <ManualQuoteNotice
          title="Not a sheet-metal part"
          message={`${analysisError ?? 'This part doesn’t look like sheet metal.'} Sheet pricing needs a part cut from one flat sheet of constant thickness. Solid or machined parts get an instant price under CNC machining.`}
        />
        {onSwitchToCnc && (
          <Button onClick={onSwitchToCnc} className="w-full rounded-sm gap-2">
            <Cog className="w-4 h-4" /> Price as CNC machining
          </Button>
        )}
        <p className="text-[10px] text-lp-muted-fg font-medium">
          Or add it as is — an engineer will price it from your file.
        </p>
      </div>
    );
  }

  if (analysisStatus === 'error') {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-sm bg-red-50 border border-red-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-red-700">{analysisError ?? 'Part analysis failed.'}</p>
        </div>
        <Button variant="outline" onClick={onRetryAnalysis} className="w-full rounded-sm gap-2">
          <RefreshCw className="w-4 h-4" /> Retry analysis
        </Button>
        <p className="text-[10px] text-lp-muted-fg font-medium">
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

  const { stats, rows, amortised } = quoteDetails(quote);
  const blocking = quote.dfmIssues.filter((i) => i.blocking);
  const warnings = quote.dfmIssues.filter((i) => !i.blocking);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h3 className="text-2xl text-lp-fg mb-1">
          Instant <span className="font-lp-serif italic text-lp-primary">quote</span>
        </h3>
        <p className="lp-label-mono text-lp-muted-fg">
          Estimated manufacturing cost
        </p>
      </div>

      <div className="p-6 rounded-sm bg-lp-primary text-lp-primary-fg shadow-sm">
        <p className="lp-label-mono text-lp-primary-fg/70 mb-1 truncate">
          {partName || 'This part'} · {quantity} pcs
        </p>
        <p className="text-4xl font-bold tracking-tight font-lp-mono" data-testid="instant-quote-total">
          {inr(quote.totalPrice)}
        </p>
        <p className="text-xs text-lp-primary-fg/70 mt-1">
          {inr(quote.pricePerPart)} per part · excl. GST &amp; shipping
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map(([icon, label, value]) => (
          <Stat key={label} icon={icon} label={label} value={value} />
        ))}
      </div>

      <div className="space-y-2">
        <p className="lp-label-mono text-lp-muted-fg">Cost per part</p>
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="font-bold text-lp-muted-fg">{label}</span>
            <span className="font-lp-mono font-bold text-lp-fg">{inr(value)}</span>
          </div>
        ))}
        <p className="text-[10px] text-lp-muted-fg font-medium pt-1">
          Includes shop margin. {amortised}
        </p>
      </div>

      {unpricedProcesses.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-sm bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-amber-700">
            Not included: {unpricedProcesses.map((p) => PROCESS_LABELS[p] ?? p).join(', ')}. Our engineers add these
            when they review your RFQ.
          </p>
        </div>
      )}

      {(blocking.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          <p className="lp-label-mono text-lp-muted-fg">Manufacturability</p>
          {[...blocking, ...warnings].map((issue, idx) => (
            <div
              key={`${issue.code}-${idx}`}
              className={`p-3 rounded-sm border text-[11px] font-bold ${
                issue.blocking ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              {issue.message}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-lp-muted-fg font-medium leading-relaxed">
        Instant prices are estimates from your part&apos;s geometry. The final price is confirmed in the quotation you
        receive after sending the RFQ.
      </p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-3 rounded-sm bg-lp-accent border border-lp-border">
      <p className="lp-label-mono text-lp-muted-fg flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="text-xs font-bold text-lp-fg mt-1">{value}</p>
    </div>
  );
}

function ManualQuoteNotice({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-3 py-6">
      <div className="flex items-center gap-2">
        <Wrench className="w-4 h-4 text-lp-primary" />
        <h3 className="lp-label-mono text-lp-fg">{title}</h3>
      </div>
      <p className="text-xs font-medium text-lp-muted-fg leading-relaxed">{message}</p>
    </div>
  );
}
