'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  ShieldCheck,
  Lock,
  CheckCircle2,
} from 'lucide-react';

interface WizardFooterProps {
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  totalPrice?: number;
}

export function WizardFooter({
  onBack,
  onNext,
  onSubmit,
  isFirstStep,
  isLastStep,
  canProceed,
  isSubmitting,
  totalPrice = 0,
}: WizardFooterProps) {
  return (
    <div className="fixed bottom-0 left-80 right-0 h-24 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-50 flex items-center justify-between px-12 shadow-2xl shadow-blue-500/5 animate-in slide-in-from-bottom duration-500">
      {/* ── LEFT: INDUSTRIAL CONFIDENCE ── */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-800">
            Precision:{' '}
            <span className="text-emerald-600 font-bold tracking-tighter">Validated</span>
          </p>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex flex-col">
          <span className="text-[8px] font-black text-blue-100 uppercase tracking-widest leading-none mb-1">
            Live Configuration Est.
          </span>
          <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">
            ₹{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* ── CENTER: QUICK STATUS ── */}
      <div className="flex items-center gap-6 opacity-40">
        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" /> Secure Session
        </div>
        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest">
          <Lock className="w-3 h-3" /> Data Encrypted
        </div>
      </div>

      {/* ── RIGHT: NAVIGATION ── */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isFirstStep || isSubmitting}
          className="h-12 px-8 tracking-[0.2em] uppercase text-[10px] font-black border-slate-200 text-slate-600 hover:bg-slate-50 transition-all rounded-xl"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {isLastStep ? (
          <Button
            onClick={onSubmit}
            disabled={!canProceed || isSubmitting}
            className="h-12 px-8 tracking-[0.2em] uppercase text-[10px] font-black bg-blue-600 hover:bg-[#1E3A66] text-white shadow-xl shadow-blue-500/20 transition-all border-none rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Finalize & Add Part
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={onNext}
            disabled={!canProceed || isSubmitting}
            className="h-12 px-10 tracking-[0.2em] uppercase text-[10px] font-black bg-blue-600 hover:bg-[#1E3A66] text-white shadow-xl shadow-blue-500/20 transition-all border-none rounded-xl group"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </div>
    </div>
  );
}
