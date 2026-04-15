'use client';

import React from 'react';
import {
  Zap,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Scale,
  Target,
  Info,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/utils';
import { ManufacturingService, SecondaryProcess } from '@/models/project.model';
import { Box } from 'lucide-react';

interface InsightsPanelProps {
  service: ManufacturingService | null;
  material: { name: string; grade: string; thickness?: number } | null;
  quantity: number;
  secondaryProcesses: SecondaryProcess[];
  unitPrice: number;
  totalPrice: number;
  cadInsights?: {
    bendCount: number;
    detectedThickness: number;
    isManufacturable: boolean;
    svg?: string;
  } | null;
}

export function InsightsPanel({
  service,
  material,
  quantity,
  secondaryProcesses,
  unitPrice,
  totalPrice,
  cadInsights,
}: InsightsPanelProps) {
  // Simulated design score (based on selected inputs)
  const designScore = service && material ? 92 : 0;

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full animate-in slide-in-from-right duration-700">
      {/* ── HEADER: REAL-TIME COST ── */}
      <div className="p-8 border-b border-slate-100 bg-slate-50/30">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
          Live Quotation
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-slate-900 tracking-tighter">
            ₹{totalPrice.toLocaleString()}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Est. Total
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between text-[10px] font-bold border-t border-slate-100 pt-4">
          <span className="text-slate-500 uppercase tracking-widest">Unit Price</span>
          <span className="text-slate-900">₹{unitPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* ── GEOMETRY ANALYSIS ── */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Geometry Analysis
          </p>
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
            <Target className="w-4 h-4 text-[#2F5FA7]" />
          </div>
        </div>

        <div className="space-y-4">
          {cadInsights ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Detected Gauge
                </span>
                <span className="text-sm font-black text-slate-900">
                  {cadInsights.detectedThickness} mm
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Bend Count
                </span>
                <span className="text-sm font-black text-slate-900">{cadInsights.bendCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">
                  Manufacturable
                </span>
                {cadInsights.isManufacturable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 border-2 border-dashed border-slate-100 rounded-2xl">
              <Box className="w-6 h-6 text-slate-200 mb-2" />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                Awaiting Analysis
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── ENGINEERING SUGGESTIONS ── */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Optimizations
          </p>
          <div className="space-y-3">
            {/* Suggestion 1 */}
            <div className="group p-4 rounded-2xl bg-blue-50/50 border border-blue-100/30 hover:bg-blue-50 transition-all cursor-help relative overflow-hidden">
              <div className="flex items-start gap-3 relative z-10">
                <Zap className="w-4 h-4 text-[#2F5FA7] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 leading-tight">
                    Material Savings
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
                    Aluminum 6061-T6 could reduce cost by 15% vs selected.
                  </p>
                </div>
              </div>
            </div>

            {/* Suggestion 2 */}
            <div className="group p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/30 hover:bg-emerald-50 transition-all cursor-help">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 leading-tight">
                    Tolerance Check
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-relaxed">
                    Default ±0.1mm is optimal for this grade.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
            Precision Status
          </p>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 rounded-lg shadow-lg">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
              Verified Geometry
            </span>
          </div>
        </div>
      </div>

      {/* ── FOOTER: CONFIDENCE ── */}
      <div className="p-8 bg-slate-50">
        <div className="flex items-start gap-3 opacity-80">
          <Info className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
            Prices are algorithmic estimates. Final quote provided after technical review.
          </p>
        </div>
      </div>
    </div>
  );
}
