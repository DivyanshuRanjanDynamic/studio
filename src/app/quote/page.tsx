'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileType,
  CheckCircle,
  ChevronRight,
  X,
  Loader2,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { BackToHomeBar } from '@/components/BackToHomeBar';
import { V2Shell } from '@/components/V2Shell';

// --- DATA & RATE CARDS ---
const MATERIALS = {
  'MS (Mild Steel)': { density: 7.85, cost: 65, hardness_factor: 1.0 },
  'SS 304': { density: 8.0, cost: 280, hardness_factor: 1.8 },
  'SS 316': { density: 8.0, cost: 380, hardness_factor: 2.0 },
  'Aluminium 6061': { density: 2.7, cost: 320, hardness_factor: 0.7 },
  'Aluminium 5052': { density: 2.68, cost: 295, hardness_factor: 0.65 },
  Copper: { density: 8.96, cost: 750, hardness_factor: 1.5 },
  Brass: { density: 8.5, cost: 600, hardness_factor: 1.3 },
  'EN8 Steel': { density: 7.85, cost: 95, hardness_factor: 1.2 },
  'EN24 Steel': { density: 7.85, cost: 140, hardness_factor: 1.6 },
};

const PROCESSES = {
  'CNC Milling/Turning 3-Axis': { rate: 1200, setup: 800, min: 600 },
  'CNC Milling/Turning 5-Axis': { rate: 2200, setup: 1500, min: 1200 },
  'Laser Cutting Fiber': { rate: 900, setup: 400, min: 300 },
  'Laser Cutting CO2': { rate: 650, setup: 300, min: 250 },
  'Sheet Metal Bending': { rate: 700, setup: 500, min: 400 },
  'TIG Welding': { rate: 600, setup: 400, min: 350 },
  'MIG Welding': { rate: 450, setup: 300, min: 250 },
  'CNC Turning/Lathe': { rate: 800, setup: 500, min: 400 },
  'Wire EDM': { rate: 1800, setup: 1200, min: 900 },
};

const QUANTITY_BREAKS = [
  { max: 1, factor: 2.8 },
  { max: 5, factor: 2.0 },
  { max: 10, factor: 1.6 },
  { max: 25, factor: 1.35 },
  { max: 50, factor: 1.18 },
  { max: 100, factor: 1.08 },
  { max: 500, factor: 0.95 },
  { max: Infinity, factor: 0.88 },
];

const getQuantityFactor = (qty: number) => {
  return QUANTITY_BREAKS.find((b) => qty <= b.max)?.factor || 0.88;
};

const FINISHES = {
  'Raw / As Machined': 1.0,
  'Powder Coating': 1.18,
  Anodizing: 1.22,
  'Zinc Plating': 1.15,
  'Chrome Plating': 1.35,
  'Nickel Plating': 1.28,
  'Sand Blasting': 1.1,
  'Mirror Polish': 1.25,
  'Black Oxide': 1.12,
};

const TOLERANCES = {
  'Standard ±0.5mm': 1.0,
  'Medium ±0.2mm': 1.2,
  'Fine ±0.1mm': 1.45,
  'Precision ±0.05mm': 1.8,
  'Ultra ±0.02mm': 2.3,
};

const COMPLEXITIES = {
  Simple: { hours: 0.3, desc: 'flat/basic shape — plates, basic brackets', days: 2 },
  Medium: { hours: 0.8, desc: 'holes/slots/bends — flanges, sheet metal parts', days: 4 },
  Complex: { hours: 1.8, desc: 'pockets/curves/threads — housings, multi-feature parts', days: 7 },
  'Highly Complex': {
    hours: 3.5,
    desc: '5-axis/intricate — impellers, aerospace geometry',
    days: 12,
  },
};

const CITIES = {
  Bengaluru: 250,
  Chennai: 250,
  Hyderabad: 250,
  Pune: 200,
  'Delhi-NCR': 200,
  Kolkata: 200,
  Mumbai: 300,
  Ahmedabad: 190,
  Coimbatore: 190,
  Other: 300,
};

const FALLBACK_INSIGHTS = [
  {
    title: 'Cost Tip',
    tip: 'Batching 25+ pieces reduces per-part cost by 18–25% with Indian job shops.',
  },
  {
    title: 'DFM Tip',
    tip: 'Adding 0.5mm corner radius on internal pockets significantly reduces CNC time.',
  },
  {
    title: 'Vendor Tip',
    tip: 'Request ISO-certified MechMasters for B2B orders requiring documentation.',
  },
];

const LOADING_MESSAGES = [
  'Parsing CAD geometry...',
  'Matching Indian material rates...',
  'Calculating milling/turning time...',
  'Applying quantity breaks...',
  'Fetching MechMaster availability...',
  'Generating AI insights...',
];

// --- MAIN COMPONENT ---
export default function QuoteEngine() {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 'loading'>(1);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  // Form State
  const [material, setMaterial] = useState(Object.keys(MATERIALS)[0]);
  const [process, setProcess] = useState(Object.keys(PROCESSES)[0]);
  const [finish, setFinish] = useState(Object.keys(FINISHES)[0]);
  const [tolerance, setTolerance] = useState(Object.keys(TOLERANCES)[0]);
  const [complexity, setComplexity] = useState(Object.keys(COMPLEXITIES)[0]);
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [city, setCity] = useState(Object.keys(CITIES)[0]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);

  // Results State
  const [results, setResults] = useState<any>(null);

  // New API/UX States
  const [insights, setInsights] = useState(FALLBACK_INSIGHTS);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [quoteRef, setQuoteRef] = useState<string>('');
  const router = useRouter();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- LOGIC ---
  const handleSampleSelect = (type: string) => {
    setFileName(`Sample_${type.replace(' ', '_')}.step`);
    setFileSize(1024 * 543);
    setFileDataUrl(null);
    setStep(2);
  };

  const computeResults = () => {
    const mat = MATERIALS[material as keyof typeof MATERIALS];
    const proc = PROCESSES[process as keyof typeof PROCESSES];
    const finMultiplier = FINISHES[finish as keyof typeof FINISHES];
    const tolMultiplier = TOLERANCES[tolerance as keyof typeof TOLERANCES];
    const comp = COMPLEXITIES[complexity as keyof typeof COMPLEXITIES];
    const cityCost = CITIES[city as keyof typeof CITIES];

    const qty = quantity || 1;
    const l = Number(length);
    const w = Number(width);
    const h = Number(height);

    const volume_cm3 = (l * w * h) / 1000;
    const utilized_volume = volume_cm3 * 0.6;
    const calc_weight_kg = (utilized_volume * mat.density) / 1000;
    const final_weight_kg = Number(weight) > 0 ? Number(weight) : calc_weight_kg || 0.1;

    const material_cost = final_weight_kg * mat.cost * mat.hardness_factor;
    const machining_cost = comp.hours * proc.rate + proc.setup;
    const base_per_part = Math.max(material_cost + machining_cost, proc.min);
    const with_finish = base_per_part * finMultiplier;
    const with_tolerance = with_finish * tolMultiplier;
    const qtyFactor = getQuantityFactor(qty);
    const per_part_with_qty = with_tolerance * qtyFactor;
    const subtotal = per_part_with_qty * qty;

    const material_cost_total = Math.round((material_cost / base_per_part) * subtotal) || 0;
    const machining_cost_total = Math.round((machining_cost / base_per_part) * subtotal) || 0;
    const finish_cost_total =
      Math.round(((with_finish - base_per_part) / base_per_part) * subtotal) || 0;

    const platform_fee = subtotal * 0.08;
    const logistics = cityCost;
    const preTax = subtotal + platform_fee + logistics;
    const gst = preTax * 0.18;
    const total = preTax + gst;

    const low_estimate = Math.round(total * 0.75);
    const high_estimate = Math.round(total * 1.25);
    const per_part_display = Math.round(per_part_with_qty);

    let leadTimeDays = comp.days;
    if (qty > 200) leadTimeDays += 5;
    else if (qty > 50) leadTimeDays += 3;
    if (tolerance.includes('Precision') || tolerance.includes('Ultra')) leadTimeDays += 2;

    return {
      weight: final_weight_kg,
      material_cost,
      machining_cost,
      finish_cost: with_finish - base_per_part,
      material_cost_total,
      machining_cost_total,
      finish_cost_total,
      platform_fee,
      logistics,
      gst,
      total,
      low_estimate,
      high_estimate,
      per_part: per_part_display,
      lead_time: leadTimeDays,
    };
  };

  const runLoadingAnimation = () => {
    return new Promise<void>((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 4;
        setLoadingProgress(progress);
        const msgIdx = Math.floor((progress / 100) * LOADING_MESSAGES.length);
        setLoadingMsgIdx(Math.min(msgIdx, LOADING_MESSAGES.length - 1));
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  };

  const fetchInsights = async (resData: any) => {
    setInsightsLoading(true);
    try {
      const res = await fetch('/api/v1/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material,
          process,
          finish,
          tolerance,
          complexity,
          quantity,
          city,
          dimensions: { l: Number(length), w: Number(width), h: Number(height) },
          estimate: { low: resData.low_estimate, high: resData.high_estimate },
        }),
      });
      const data = await res.json();
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
      } else {
        setInsights(FALLBACK_INSIGHTS);
      }
    } catch {
      setInsights(FALLBACK_INSIGHTS);
    } finally {
      setInsightsLoading(false);
    }
  };

  const calculateQuote = async () => {
    const l = Number(length);
    const w = Number(width);
    const h = Number(height);
    const wt = Number(weight);

    const hasDimensions = l > 0 && w > 0 && h > 0;
    const hasWeight = wt > 0;

    if (!hasDimensions && !hasWeight) {
      toast({
        title: 'Missing dimensions',
        description: 'Please provide either Bounding Box dimensions or a weight estimate.',
        variant: 'destructive',
      });
      return;
    }
    if (l > 3000 || w > 3000 || h > 3000) {
      toast({
        title: 'Dimension too large',
        description: 'Maximum dimension is 3000mm. Contact us for larger parts.',
        variant: 'destructive',
      });
      return;
    }
    if (quantity < 1 || quantity > 10000) {
      toast({
        title: 'Invalid quantity',
        description: 'Quantity must be between 1 and 10,000 pieces.',
        variant: 'destructive',
      });
      return;
    }

    const calculatedResults = computeResults();
    setResults(calculatedResults);
    setQuoteRef(`MH-${Date.now().toString(36).toUpperCase().slice(-6)}`);

    setStep('loading');
    setLoadingProgress(0);
    setLoadingMsgIdx(0);

    await runLoadingAnimation();

    setStep(3);
    fetchInsights(calculatedResults);
  };

  return (
    <V2Shell noFooter>
    <div className="min-h-screen bg-lp-bg text-lp-fg px-4 sm:px-6 lg:px-8 font-lp-sans relative">
      <div className="absolute inset-0 lp-grid-bg pointer-events-none" />
      <BackToHomeBar className="max-w-5xl relative z-10 pt-24 pb-2 px-0" />
      <div className="max-w-5xl mx-auto relative z-10 pb-12">
        {/* Header & Stepper */}
        <div className="mb-12">
          <span className="lp-label-mono text-lp-primary bg-lp-accent px-3 py-1.5 rounded-sm border border-lp-border inline-block mb-4">Budget Estimator</span>
          <h1 className="text-3xl md:text-5xl tracking-tight font-medium text-lp-fg mb-4">
            Get a <em className="lp-accent-serif text-lp-primary">rough estimate</em>
          </h1>
          <p className="text-lp-muted-fg text-base mb-8">
            Plan your budget before speaking to a MechMaster.
          </p>

          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-lp-border z-0 overflow-hidden">
              <div
                className="h-full bg-lp-primary transition-all duration-700 ease-in-out"
                style={{
                  width: step === 1 ? '0%' : step === 2 || step === 'loading' ? '50%' : '100%',
                }}
              />
            </div>

            {[1, 2, 3].map((s) => {
              const isActive = step === s || (step === 'loading' && s === 2);
              const isPast =
                (typeof step === 'number' && step > s) ||
                (step === 'loading' && s < 2) ||
                step === 3;

              return (
                <div key={s} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-sm flex items-center justify-center font-medium text-sm transition-all duration-500 border ${
                      isActive
                        ? 'bg-lp-primary border-lp-primary text-lp-primary-fg scale-110'
                        : isPast
                          ? 'bg-lp-primary border-lp-primary text-lp-primary-fg'
                          : 'bg-lp-card border-lp-border text-lp-muted-fg'
                    }`}
                  >
                    {isPast ? <CheckCircle size={18} /> : <span>{s}</span>}
                  </div>
                  <span
                    className={`mt-2 lp-label-mono ${isActive || isPast ? 'text-lp-primary' : 'text-lp-muted-fg'}`}
                  >
                    {s === 1 ? 'Part Type' : s === 2 ? 'Specs' : 'Results'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- STEP 1: UPLOAD --- */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div
              className="border-2 border-dashed border-lp-border rounded-sm p-16 text-center bg-lp-card hover:bg-lp-accent transition-all cursor-pointer group hover:border-lp-primary/50 relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".step,.stp,.stl,.dxf,.dwg,.pdf,.iges,.igs"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFileName(file.name);
                    setFileSize(file.size);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setFileDataUrl(event.target?.result as string);
                      setStep(2);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <div className="w-20 h-20 bg-lp-accent border border-lp-border rounded-sm flex items-center justify-center mx-auto mb-8 group-hover:scale-105 group-hover:bg-lp-primary transition-all relative z-10">
                <UploadCloud className="w-10 h-10 text-lp-primary group-hover:text-lp-primary-fg transition-colors" />
              </div>
              <h3 className="text-xl font-medium mb-3 text-lp-fg relative z-10">
                Analyze Part Geometry
              </h3>
              <p className="lp-label-mono text-lp-muted-fg mb-8 relative z-10">
                Drag and drop or click to upload your CAD file
              </p>
              <div className="flex flex-wrap justify-center gap-2 relative z-10">
                {['.STEP', '.STP', '.STL', '.DXF', '.DWG'].map((ext) => (
                  <span key={ext} className="lp-tag">{ext}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 lp-label-mono text-lp-muted-fg">
              <span className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" /> Secure NDA Protection
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" /> Instant Cost Analysis
              </span>
            </div>

            <div className="pt-8 border-t border-lp-border">
              <p className="lp-label-mono text-lp-muted-fg mb-5 text-center">
                Or try building from a reference
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Flange Plate', 'Shaft Collar', 'Mounting Bracket', 'Custom Housing'].map(
                  (sample) => (
                    <button
                      key={sample}
                      onClick={() => handleSampleSelect(sample)}
                      className="p-5 rounded-sm bg-lp-card border border-lp-border hover:border-lp-primary/50 hover:bg-lp-accent hover:-translate-y-0.5 transition-all lp-label-mono flex flex-col items-center gap-3 text-lp-muted-fg hover:text-lp-primary transform-gpu"
                    >
                      <FileType className="w-5 h-5 text-lp-muted-fg" />
                      {sample}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 2: PARAMETERS --- */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="flex items-center justify-between mb-6 bg-lp-card border border-lp-border p-4 rounded-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-lp-accent rounded-sm border border-lp-border">
                  <FileType size={18} className="text-lp-primary" />
                </div>
                <div>
                  <span className="font-medium text-lp-fg text-sm block">{fileName}</span>
                  <span className="lp-label-mono text-lp-muted-fg">Selected CAD Assembly</span>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="lp-label-mono text-lp-primary hover:text-lp-fg flex items-center gap-1.5 transition-colors bg-lp-accent px-3 py-1.5 rounded-sm border border-lp-border"
              >
                <X size={14} /> Change file
              </button>
            </div>

            <div className="bg-lp-card border border-lp-border rounded-sm p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-lp-primary" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4">
                {/* Left Col */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="block lp-label-mono text-lp-muted-fg ml-1">Material</label>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 appearance-none custom-select transition-all text-sm"
                    >
                      {Object.keys(MATERIALS).map((m) => (
                        <option key={m} value={m} className="bg-white">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block lp-label-mono text-lp-muted-fg ml-1">
                      Manufacturing Process
                    </label>
                    <select
                      value={process}
                      onChange={(e) => setProcess(e.target.value)}
                      className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 appearance-none custom-select transition-all text-sm"
                    >
                      {Object.keys(PROCESSES).map((p) => (
                        <option key={p} value={p} className="bg-white">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block lp-label-mono text-lp-muted-fg ml-1">
                      Surface Finish
                    </label>
                    <select
                      value={finish}
                      onChange={(e) => setFinish(e.target.value)}
                      className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 appearance-none custom-select transition-all text-sm"
                    >
                      {Object.keys(FINISHES).map((f) => (
                        <option key={f} value={f} className="bg-white">
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block lp-label-mono text-lp-muted-fg ml-1">
                      Tolerance Requirements
                    </label>
                    <select
                      value={tolerance}
                      onChange={(e) => setTolerance(e.target.value)}
                      className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 appearance-none custom-select transition-all text-sm"
                    >
                      {Object.keys(TOLERANCES).map((t) => (
                        <option key={t} value={t} className="bg-white">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Col */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="block lp-label-mono text-lp-muted-fg ml-1">
                      Part Complexity
                    </label>
                    <select
                      value={complexity}
                      onChange={(e) => setComplexity(e.target.value)}
                      className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 appearance-none custom-select transition-all text-sm mb-2"
                    >
                      {Object.keys(COMPLEXITIES).map((c) => (
                        <option key={c} value={c} className="bg-white">
                          {c}
                        </option>
                      ))}
                    </select>
                    <p className="lp-label-mono text-lp-muted-fg">
                      &quot;{COMPLEXITIES[complexity as keyof typeof COMPLEXITIES].desc}&quot;
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block lp-label-mono text-lp-muted-fg ml-1">
                      Bounding Box (mm)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="L"
                          value={length}
                          onChange={(e) => setLength(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 focus:outline-none pl-10 transition-all font-medium placeholder:text-lp-muted-fg/50 text-sm"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lp-muted-fg lp-label-mono">
                          L
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="W"
                          value={width}
                          onChange={(e) => setWidth(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 focus:outline-none pl-10 transition-all font-medium placeholder:text-lp-muted-fg/50 text-sm"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lp-muted-fg lp-label-mono">
                          W
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="H"
                          value={height}
                          onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 focus:outline-none pl-10 transition-all font-medium placeholder:text-lp-muted-fg/50 text-sm"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lp-muted-fg lp-label-mono">
                          H
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block lp-label-mono text-lp-muted-fg ml-1">
                      Quantity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 transition-all font-medium text-sm"
                      />
                      {quantity >= 25 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 lp-label-mono bg-emerald-50/50 text-emerald-600 border border-emerald-200/30 px-2 py-1 rounded-sm flex items-center gap-1">
                          <Info size={10} /> Bulk Applied
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block lp-label-mono text-lp-muted-fg ml-1">
                      Delivery City
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-lp-accent border border-lp-border rounded-sm px-4 py-3 text-lp-fg focus:outline-none focus:border-lp-primary focus:ring-2 focus:ring-lp-primary/10 hover:border-lp-muted-fg/30 appearance-none custom-select transition-all text-sm"
                    >
                      {Object.keys(CITIES).map((c) => (
                        <option key={c} value={c} className="bg-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-lp-border flex justify-between items-center relative z-10">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-sm border border-lp-border bg-lp-card text-lp-muted-fg hover:text-lp-fg hover:border-lp-muted-fg/50 transition-all lp-label-mono"
                >
                  &larr; Back
                </button>
                <button
                  onClick={calculateQuote}
                  className="bg-lp-primary hover:bg-lp-primary/90 text-lp-primary-fg lp-label-mono py-3 px-8 rounded-sm transition-all flex items-center gap-2 active:scale-[0.98]"
                >
                  Calculate Range <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- LOADING --- */}
        {step === 'loading' && (
          <div className="bg-lp-card border border-lp-border rounded-sm p-20 flex flex-col items-center justify-center min-h-[500px]">
            <div className="relative w-20 h-20 mb-8">
              <Loader2 className="w-full h-full text-lp-primary animate-[spin_2s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-lp-primary/10 rounded-sm animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-lp-fg mb-3">Analyzing Constraints</h3>
            <p className="lp-label-mono text-lp-muted-fg mb-8">
              Matching requirements with MechMaster machine rates
            </p>

            <div className="w-full max-w-sm bg-lp-accent rounded-sm h-1 mb-5 overflow-hidden">
              <div
                className="bg-lp-primary h-full transition-all duration-300 ease-linear"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            <p className="text-lp-primary lp-label-mono animate-pulse h-5">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </div>
        )}

        {/* --- STEP 3: RESULTS --- */}
        {step === 3 && results && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
            {/* Unified SaaS Estimate Panel */}
            <div className="bg-lp-card border border-lp-border rounded-sm overflow-hidden relative">
              {/* Alert Banner */}
              <div className="bg-amber-50/50 border-b border-amber-200/30 px-6 py-4 flex items-start gap-3 relative z-10">
                <div className="p-1.5 bg-lp-bg rounded-sm border border-amber-200/50">
                  <Info size={16} className="text-amber-600 shrink-0" />
                </div>
                <p className="text-xs text-amber-700/80 leading-relaxed">
                  <strong className="text-amber-800">Planning estimate only.</strong> Actual quote may vary based on CAD geometry, tolerances, and machine availability.
                </p>
              </div>

              {/* Header & Ref */}
              <div className="px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-lp-border relative z-10 bg-lp-accent/50">
                <div>
                  <h2 className="text-xl font-medium text-lp-fg">Est. Budget Range</h2>
                  <p className="lp-label-mono text-lp-muted-fg mt-1">
                    Projected for Indian Manufacturing Job Shops
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-lp-bg border border-lp-border rounded-sm px-4 py-2">
                  <span className="lp-label-mono text-lp-primary">Ref</span>
                  <span className="text-sm font-medium text-lp-fg font-lp-mono">{quoteRef}</span>
                </div>
              </div>

              {/* Main Split Content */}
              <div className="flex flex-col md:flex-row relative z-10">
                <div className="flex-1 p-8 md:border-r border-lp-border flex flex-col justify-center">
                  <div className="mb-2">
                    <span className="text-4xl md:text-6xl font-medium tracking-tighter text-lp-fg block">
                      ₹{results.low_estimate.toLocaleString('en-IN')}{' '}
                      <span className="text-lp-border text-4xl font-light">–</span> ₹{results.high_estimate.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="lp-label-mono text-lp-muted-fg flex items-center gap-2 mt-4">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Indicative manufacturing band (incl. taxes)
                  </p>
                </div>

                <div className="w-full md:w-80 p-8 bg-lp-accent/50 flex flex-col justify-center">
                  <h4 className="lp-label-mono text-lp-primary mb-5">Specification Profile</h4>
                  <ul className="space-y-3">
                    {[
                      ['Material', material],
                      ['Process', process],
                      ['Finish', finish],
                      ['Tolerance', tolerance],
                    ].map(([label, val]) => (
                      <li key={label} className="flex justify-between items-center">
                        <span className="lp-label-mono text-lp-muted-fg">{label}</span>
                        <span className="text-xs font-medium text-lp-fg text-right">{val}</span>
                      </li>
                    ))}
                    <li className="flex justify-between items-center pt-2 border-t border-lp-border">
                      <span className="lp-label-mono text-lp-primary">Est. Weight</span>
                      <span className="text-xs font-medium text-lp-primary text-right font-lp-mono">
                        {results.weight.toFixed(2)} kg/pc
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-lp-border relative z-10">
                {[
                  { label: 'Per Part (incl. GST)', value: `₹${results.per_part.toLocaleString('en-IN')}` },
                  { label: 'Build Volume', value: quantity, suffix: 'Units' },
                  { label: 'Est. Lead Time', value: results.lead_time, suffix: 'Days', accent: true },
                ].map((metric, i) => (
                  <div key={metric.label} className={`p-6 flex flex-col items-center sm:items-start group hover:bg-lp-accent transition-colors ${i > 0 ? 'border-t sm:border-t-0 sm:border-l border-lp-border' : ''}`}>
                    <p className={`lp-label-mono mb-2 ${metric.accent ? 'text-lp-primary' : 'text-lp-muted-fg'} group-hover:text-lp-primary transition-colors`}>
                      {metric.label}
                    </p>
                    <p className="text-2xl font-medium text-lp-fg">
                      {metric.value}
                      {metric.suffix && <span className="lp-label-mono text-lp-muted-fg ml-1.5">{metric.suffix}</span>}
                    </p>
                  </div>
                ))}
              </div>

              {/* Optional Bulk Discount Banner */}
              {quantity >= 10 && (
                <div className="bg-emerald-50/50 border-t border-emerald-200/30 px-6 py-4 flex items-center gap-3">
                  <Info size={14} className="text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-700">
                    <strong>Bulk Advantage:</strong> Saving ₹{Math.round((results.total / 0.88) * 2.8 - results.total).toLocaleString('en-IN')} vs prototype pricing
                  </p>
                </div>
              )}
            </div>

            {/* Middle Row: Breakdown & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <div className="bg-lp-card border border-lp-border rounded-sm p-8">
                <h3 className="text-base font-medium text-lp-fg mb-6">Financial Breakdown</h3>
                <div className="space-y-4 text-sm">
                  {[
                    ['Material Cost', results.material_cost_total],
                    ['Milling/Turning Cost', results.machining_cost_total],
                    ['Finishing & Surface', results.finish_cost_total],
                    ['Platform & QC Fee', results.platform_fee],
                    ['Logistics (India)', results.logistics],
                    ['GST (18%)', results.gst],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between border-b border-lp-border pb-3">
                      <span className="lp-label-mono text-lp-muted-fg">{label}</span>
                      <span className="font-medium text-lp-fg font-lp-mono">
                        ₹{(val as number)?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 text-xl font-medium text-lp-fg">
                    <span className="lp-label-mono text-lp-primary pt-1">Total Estimate</span>
                    <span className="font-lp-mono">₹{results.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>

              <div className="bg-lp-accent border border-lp-border rounded-sm p-8">
                <h3 className="text-base font-medium text-lp-fg mb-6 flex items-center gap-2">
                  <Info size={18} className="text-lp-primary" /> Cost Adjustment Factors
                </h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {[
                    ['CAD Complexity', 'Intricate features requiring special tooling or 5-axis work.'],
                    ['Tolerance Precision', 'Sub-micron tolerances drastically increase machine run-time.'],
                    ['Market Volatility', 'Raw material (AL/SS) spot prices fluctuate daily.'],
                    ['Logistics & Weight', 'Final heavy part logistics may carry additional surcharges.'],
                    ['Supply Chain Load', 'Peak manufacturing cycles may impact lead-time premiums.'],
                  ].map(([factor, desc]) => (
                    <div key={factor} className="flex gap-3 items-start bg-lp-bg p-4 rounded-sm border border-lp-border group hover:border-lp-primary/30 transition-all">
                      <div className="w-1.5 h-1.5 rounded-full bg-lp-primary mt-1.5 shrink-0 group-hover:scale-150 transition-transform" />
                      <div>
                        <p className="lp-label-mono text-lp-fg mb-1">{factor}</p>
                        <p className="text-lp-muted-fg text-xs leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-lp-ink border border-lp-border p-8 rounded-sm flex flex-col xl:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div>
                <p className="lp-label-mono text-lp-ink-fg/60 mb-1.5">Ready to manufacture?</p>
                <p className="text-sm text-lp-ink-fg max-w-sm leading-relaxed">
                  Request a formal quote for firm pricing and production slot booking.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 justify-end w-full xl:w-auto">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-sm border border-lp-ink-fg/20 text-lp-ink-fg lp-label-mono hover:bg-lp-ink-fg/10 transition-all flex-1 sm:flex-none"
                >
                  New Estimate
                </button>
                <button
                  onClick={() => {
                    const contactUrl = `/consultation?ref=${quoteRef}&material=${encodeURIComponent(material)}&process=${encodeURIComponent(process)}&qty=${quantity}&estimate=${encodeURIComponent(`₹${results.low_estimate}–₹${results.high_estimate}`)}`;
                    if (user) {
                      router.push(contactUrl);
                    } else {
                      router.push(`/login?tab=register&redirect=${encodeURIComponent(contactUrl)}`);
                    }
                  }}
                  className="px-8 py-3 rounded-sm bg-lp-primary-fg text-lp-primary lp-label-mono hover:scale-[1.02] active:scale-[0.98] transition-all flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  Talk to an Expert <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394A3B8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 1rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
      `,
        }}
      />
    </div>
    </V2Shell>
  );
}
