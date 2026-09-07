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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-600 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-500/10 selection:text-blue-600 relative">
      {/* Background Decor */}
      <div
        className="absolute inset-0 bg-white/50"
        style={{
          backgroundImage: 'radial-gradient(#2F5FA710 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <BackToHomeBar className="max-w-5xl relative z-10 pt-24 pb-2 px-0" />
      <div className="max-w-5xl mx-auto relative z-10 pb-12">
        {/* Header & Stepper */}
        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl uppercase tracking-tight font-bold text-slate-900 mb-4">
            Budget Estimator
          </h1>
          <p className="text-blue-200 text-lg mb-8 font-medium">
            Get a rough cost range to plan your project — before speaking to a MechMaster.
          </p>

          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-700 ease-in-out"
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
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm transition-all duration-500 border-2 ${
                      isActive
                        ? 'bg-blue-600 border-[#2F5FA7] text-white shadow-xl scale-110'
                        : isPast
                          ? 'bg-blue-600 border-[#2F5FA7] text-white'
                          : 'bg-white border-slate-200 text-blue-100'
                    }`}
                  >
                    {isPast ? <CheckCircle size={20} /> : <span className="">{s}</span>}
                  </div>
                  <span
                    className={`mt-3 text-[10px] font-bold uppercase tracking-[0.2em] ${isActive || isPast ? 'text-[#2F5FA7]' : 'text-blue-100'}`}
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
              className="border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center bg-white hover:bg-slate-50 transition-all cursor-pointer group hover:border-[#2F5FA7]/50 shadow-2xl relative overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="absolute inset-0 bg-blue-50/10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#2F5FA705 1px, transparent 1px)',
                  backgroundSize: '30px 30px',
                }}
              />
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
              <div className="w-24 h-24 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:scale-105 group-hover:bg-blue-600 transition-all shadow-lg relative z-10">
                <UploadCloud className="w-12 h-12 text-[#2F5FA7] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-2xl uppercase tracking-tight font-bold mb-3 text-slate-900 relative z-10">
                Analyze Part Geometry
              </h3>
              <p className="text-blue-100 font-bold uppercase tracking-widest mb-8 text-[11px] relative z-10">
                Drag and drop or click to upload your CAD file
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-[10px] text-[#2F5FA7] font-bold tracking-widest uppercase relative z-10">
                <span className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  .STEP
                </span>
                <span className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  .STP
                </span>
                <span className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  .STL
                </span>
                <span className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  .DXF
                </span>
                <span className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                  .DWG
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 text-[11px] font-bold tracking-widest uppercase text-blue-100">
              <span className="flex items-center gap-2.5">
                <CheckCircle size={16} className="text-emerald-500" /> SECURE NDA PROTECTION
              </span>
              <span className="flex items-center gap-2.5">
                <CheckCircle size={16} className="text-emerald-500" /> INSTANT COST ANALYSIS
              </span>
            </div>

            <div className="pt-10 border-t border-slate-200">
              <p className="text-[10px] font-bold text-blue-100 mb-6 uppercase tracking-[0.2em] text-center">
                Or try building from a reference
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {['Flange Plate', 'Shaft Collar', 'Mounting Bracket', 'Custom Housing'].map(
                  (sample) => (
                    <button
                      key={sample}
                      onClick={() => handleSampleSelect(sample)}
                      className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-[#2F5FA7] hover:bg-slate-50 hover:-translate-y-1 transition-all text-[11px] uppercase tracking-widest font-bold flex flex-col items-center gap-4 text-slate-600 hover:text-[#2F5FA7] shadow-sm transform-gpu"
                    >
                      <FileType className="w-6 h-6 text-slate-300 group-hover:text-[#2F5FA7]" />
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
            <div className="flex items-center justify-between mb-8 bg-white border border-slate-100 p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <FileType size={20} className="text-[#2F5FA7]" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 block">{fileName}</span>
                  <span className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">
                    Selected CAD Assembly
                  </span>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-[10px] font-bold uppercase tracking-widest text-[#2F5FA7] hover:text-[#1E3A66] flex items-center gap-1.5 transition-colors bg-blue-50 px-4 py-2 rounded-xl border border-blue-100"
              >
                <X size={14} /> Change file
              </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
              {/* Top line accent */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4">
                {/* Left Col */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Material
                    </label>
                    <select
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 appearance-none custom-select transition-all font-medium"
                    >
                      {Object.keys(MATERIALS).map((m) => (
                        <option key={m} value={m} className="bg-white">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Manufacturing Process
                    </label>
                    <select
                      value={process}
                      onChange={(e) => setProcess(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 appearance-none custom-select transition-all font-medium"
                    >
                      {Object.keys(PROCESSES).map((p) => (
                        <option key={p} value={p} className="bg-white">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Surface Finish
                    </label>
                    <select
                      value={finish}
                      onChange={(e) => setFinish(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 appearance-none custom-select transition-all font-medium"
                    >
                      {Object.keys(FINISHES).map((f) => (
                        <option key={f} value={f} className="bg-white">
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Tolerance Requirements
                    </label>
                    <select
                      value={tolerance}
                      onChange={(e) => setTolerance(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 appearance-none custom-select transition-all font-medium"
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
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Part Complexity
                    </label>
                    <select
                      value={complexity}
                      onChange={(e) => setComplexity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 appearance-none custom-select transition-all font-medium mb-2"
                    >
                      {Object.keys(COMPLEXITIES).map((c) => (
                        <option key={c} value={c} className="bg-white">
                          {c}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest">
                      &quot;{COMPLEXITIES[complexity as keyof typeof COMPLEXITIES].desc}&quot;
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Bounding Box (mm)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="L"
                          value={length}
                          onChange={(e) => setLength(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 focus:outline-none pl-10 transition-all font-bold placeholder:text-slate-300"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-bold uppercase">
                          L
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="W"
                          value={width}
                          onChange={(e) => setWidth(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 focus:outline-none pl-10 transition-all font-bold placeholder:text-slate-300"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-bold uppercase">
                          W
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="H"
                          value={height}
                          onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 text-slate-900 focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 focus:outline-none pl-10 transition-all font-bold placeholder:text-slate-300"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px] font-bold uppercase">
                          H
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Quantity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="10000"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 transition-all font-bold"
                      />
                      {quantity >= 25 && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg font-bold uppercase tracking-widest flex items-center gap-1">
                          <Info size={10} /> Bulk Applied
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-blue-100 uppercase tracking-widest ml-1">
                      Delivery City
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-900 focus:outline-none focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 hover:border-slate-300 appearance-none custom-select transition-all font-medium"
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

              <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center relative z-10">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-4 rounded-2xl border border-slate-200 bg-white text-blue-100 hover:text-slate-900 hover:border-slate-400 transition-all font-bold uppercase tracking-widest text-[11px]"
                >
                  ← Back
                </button>
                <button
                  onClick={calculateQuote}
                  className="bg-blue-600 hover:bg-[#1E3A66] shadow-xl text-white font-bold tracking-widest uppercase text-[11px] py-4 px-10 rounded-2xl transition-all flex items-center gap-2 transform active:scale-95"
                >
                  Calculate Range <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- LOADING --- */}
        {step === 'loading' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-20 flex flex-col items-center justify-center min-h-[500px] shadow-2xl">
            <div className="relative w-24 h-24 mb-10">
              <Loader2 className="w-full h-full text-[#2F5FA7] animate-[spin_2s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-[#2F5FA7]/10 rounded-xl animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl uppercase tracking-tight font-bold text-slate-900 mb-4">
              Analyzing Constraints
            </h3>
            <p className="text-blue-100 font-bold uppercase tracking-widest text-[10px] mb-10">
              Matching requirements with MechMaster machine rates
            </p>

            <div className="w-full max-w-sm bg-slate-100 rounded-full h-1.5 mb-6 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300 ease-linear rounded-full"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>

            <p className="text-[#2F5FA7] font-bold text-[11px] animate-pulse h-6 tracking-widest uppercase">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </div>
        )}

        {/* --- STEP 3: RESULTS --- */}
        {step === 3 && results && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-5xl mx-auto">
            {/* Unified SaaS Estimate Panel */}
            <div className="bg-white border border-slate-100 shadow-2xl rounded-3xl overflow-hidden relative">
              {/* Alert Banner */}
              <div className="bg-amber-50 border-b border-amber-100 px-8 py-5 flex items-start gap-4 relative z-10">
                <div className="p-2 bg-white rounded-lg border border-amber-200 shadow-sm">
                  <Info size={18} className="text-amber-600 shrink-0" />
                </div>
                <p className="text-xs text-amber-700 leading-relaxed font-bold uppercase tracking-wider uppercase">
                  <strong className="text-amber-800">Planning estimate only.</strong> Actual quote
                  may vary within indicative range based on CAD geometry, strict tolerances, and
                  real-time machine availability. Use this to plan your budget, then request an
                  exact quote.
                </p>
              </div>

              {/* Header & Ref */}
              <div className="px-10 py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 relative z-10 bg-slate-50/30">
                <div>
                  <h2 className="text-2xl uppercase tracking-tight font-bold text-slate-900">
                    Est. Budget Range
                  </h2>
                  <p className="text-[10px] text-blue-100 mt-1 uppercase tracking-[0.2em] font-bold">
                    Projected for Indian Manufacturing Job Shops
                  </p>
                </div>
                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
                  <span className="text-[10px] text-[#2F5FA7] font-bold uppercase tracking-widest">
                    Ref Case
                  </span>
                  <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    {quoteRef}
                  </span>
                </div>
              </div>

              {/* Main Split Content */}
              <div className="flex flex-col md:flex-row relative z-10">
                {/* Left Side: Pricing */}
                <div className="flex-1 p-10 md:border-r border-slate-50 flex flex-col justify-center bg-white">
                  <div className="mb-2">
                    <span className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 block flex items-baseline gap-2">
                      ₹{results.low_estimate.toLocaleString('en-IN')}{' '}
                      <span className="text-slate-200 text-5xl font-light">–</span> ₹
                      {results.high_estimate.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-100 flex items-center gap-2 uppercase tracking-widest font-bold mt-6">
                    <CheckCircle className="w-4 h-4 text-emerald-500" /> Indicative manufacturing
                    band (incl. taxes)
                  </p>
                </div>

                {/* Right Side: Specs Snapshot */}
                <div className="w-full md:w-96 p-10 bg-slate-50/50 flex flex-col justify-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2F5FA7] mb-6">
                    Specification Profile
                  </h4>
                  <ul className="space-y-4">
                    <li className="flex justify-between items-center">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-blue-100">
                        Material
                      </span>{' '}
                      <span className="text-xs font-bold text-slate-900 text-right">
                        {material}
                      </span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-blue-100">
                        Process
                      </span>{' '}
                      <span className="text-xs font-bold text-slate-900 text-right">{process}</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-blue-100">
                        Finish
                      </span>{' '}
                      <span className="text-xs font-bold text-slate-900 text-right">{finish}</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-blue-100">
                        Tolerance
                      </span>{' '}
                      <span className="text-xs font-bold text-slate-900 text-right">
                        {tolerance}
                      </span>
                    </li>
                    <li className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold tracking-widest uppercase text-[#2F5FA7]">
                        Est. Weight
                      </span>{' '}
                      <span className="text-xs font-bold text-[#204a80] text-right">
                        {results.weight.toFixed(2)} kg/pc
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Bottom Metric Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 border-t border-slate-100 bg-white relative z-10">
                <div className="p-8 flex flex-col items-center sm:items-start group hover:bg-slate-50 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-3 group-hover:text-[#2F5FA7] transition-colors">
                    Per Part (incl. GST)
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹{results.per_part.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-8 flex flex-col items-center sm:items-start group hover:bg-slate-50 transition-colors">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-3 group-hover:text-[#2F5FA7] transition-colors">
                    Build Volume
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {quantity}{' '}
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1">
                      Units
                    </span>
                  </p>
                </div>
                <div className="p-8 flex flex-col items-center sm:items-start relative overflow-hidden group hover:bg-blue-600 transition-all duration-500">
                  <div className="absolute inset-0 bg-[#2F5FA7]/5 group-hover:bg-blue-600 transition-colors" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#2F5FA7] mb-3 relative z-10 group-hover:text-blue-100">
                    Est. Lead Time
                  </p>
                  <p className="text-3xl font-bold text-slate-900 relative z-10 group-hover:text-white transition-colors">
                    {results.lead_time}{' '}
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-300 ml-1 group-hover:text-blue-200">
                      Days
                    </span>
                  </p>
                </div>
              </div>

              {/* Optional Bulk Discount Banner */}
              {quantity >= 10 && (
                <div className="bg-emerald-50 border-t border-emerald-100 px-10 py-5 flex items-center gap-4">
                  <div className="p-1.5 bg-white rounded-lg border border-emerald-200 shadow-sm">
                    <Info size={14} className="text-emerald-500" />
                  </div>
                  <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-widest">
                    <strong className="text-emerald-800">Bulk Advantage:</strong> You are saving ₹
                    {Math.round((results.total / 0.88) * 2.8 - results.total).toLocaleString(
                      'en-IN'
                    )}{' '}
                    vs prototype pricing
                  </p>
                </div>
              )}
            </div>

            {/* Middle Row: Breakdown & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Detailed Breakdown Table */}
              <div className="bg-white border border-slate-100 rounded-3xl p-10 shadow-2xl">
                <h3 className="text-lg uppercase tracking-tight font-bold text-slate-900 mb-8">
                  Financial Breakdown
                </h3>

                <div className="space-y-6 font-medium text-sm">
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-blue-100 font-bold uppercase tracking-widest text-[10px] pt-1">
                      Material Cost
                    </span>
                    <span className="text-slate-900 font-bold">
                      ₹
                      {results.material_cost_total?.toLocaleString('en-IN', {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-blue-100 font-bold uppercase tracking-widest text-[10px] pt-1">
                      Milling/Turning Cost
                    </span>
                    <span className="text-slate-900 font-bold">
                      ₹
                      {results.machining_cost_total?.toLocaleString('en-IN', {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-blue-100 font-bold uppercase tracking-widest text-[10px] pt-1">
                      Finishing & Surface
                    </span>
                    <span className="text-slate-900 font-bold">
                      ₹
                      {results.finish_cost_total?.toLocaleString('en-IN', {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-[#2F5FA7] font-bold uppercase tracking-widest text-[10px] pt-1">
                      Platform & QC Fee
                    </span>
                    <span className="text-slate-900 font-bold">
                      ₹{results.platform_fee.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-blue-100 font-bold uppercase tracking-widest text-[10px] pt-1">
                      Logistics (India)
                    </span>
                    <span className="text-slate-900 font-bold">
                      ₹{results.logistics.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 pb-3">
                    <span className="text-blue-100 font-bold uppercase tracking-widest text-[10px] pt-1">
                      Applicable GST (18%)
                    </span>
                    <span className="text-slate-900 font-bold">
                      ₹{results.gst.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="flex justify-between pt-4 text-2xl font-bold text-slate-900">
                    <span className="uppercase tracking-widest text-[10px] pt-2 text-[#2F5FA7]">
                      Total Estimate
                    </span>
                    <span>
                      ₹{results.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* What Affects Your Final Quote */}
              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-10 shadow-sm">
                <h3 className="text-slate-900 uppercase tracking-tight font-bold text-lg mb-8 flex items-center gap-3">
                  <Info size={20} className="text-[#2F5FA7]" />
                  Cost Adjustment Factors
                </h3>
                <div className="grid grid-cols-1 gap-5 text-sm">
                  {[
                    [
                      'CAD Complexity',
                      'Intricate features requiring special tooling or 5-axis work.',
                    ],
                    [
                      'Tolerance Precision',
                      'Sub-micron tolerances drastically increase machine run-time.',
                    ],
                    ['Market Volatility', 'Raw material (AL/SS) spot prices fluctuate daily.'],
                    [
                      'Logistics & Weight',
                      'Final heavy part logistics may carry additional surcharges.',
                    ],
                    [
                      'Supply Chain Load',
                      'Peak manufacturing cycles may impact lead-time premiums.',
                    ],
                  ].map(([factor, desc]) => (
                    <div
                      key={factor}
                      className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-slate-100 shadow-sm group hover:border-[#2F5FA7] transition-all"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 group-hover:scale-150 transition-transform" />
                      <div>
                        <p className="text-slate-900 font-bold uppercase tracking-[0.1em] text-[10px] mb-1.5">
                          {factor}
                        </p>
                        <p className="text-blue-100 text-xs leading-relaxed font-medium">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-blue-600 border border-[#2F5FA7] p-10 rounded-3xl flex flex-col xl:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden group">
              <div
                className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <div className="relative z-10">
                <p className="text-[10px] text-blue-200 uppercase tracking-[0.3em] font-bold mb-2">
                  Ready to manufacture?
                </p>
                <p className="text-sm text-white max-w-sm uppercase tracking-widest leading-relaxed font-bold">
                  Request a formal quote for firm pricing and production slot booking.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 justify-end w-full xl:w-auto relative z-10">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-4 rounded-2xl border border-white/20 bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all flex-1 sm:flex-none"
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
                  className="px-10 py-4 rounded-2xl bg-white text-[#2F5FA7] font-bold uppercase tracking-widest text-[10px] shadow-xl hover:shadow-2xl transition-all hover:scale-[1.05] active:scale-95 flex-1 sm:flex-none flex items-center justify-center gap-3"
                >
                  Talk to an Expert <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Styles for custom select dropdown arrows to match light theme */}
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
  );
}
