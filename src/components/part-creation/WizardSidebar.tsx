'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/utils';

interface WizardSidebarProps {
  steps: { id: string; label: string; icon: React.ReactNode }[];
  currentStepIndex: number;
}

export function WizardSidebar({ steps, currentStepIndex }: WizardSidebarProps) {
  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full animate-in slide-in-from-left duration-700">
      {/* ── HEADER ── */}
      <div className="p-8 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/10">
            <span className="text-white font-black text-xs">M</span>
          </div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
            MechHub Studio
          </h2>
        </div>
        <p className="text-[10px] font-bold text-blue-100 uppercase tracking-widest">
          Part Configuration Engine
        </p>
      </div>

      {/* ── STEPS ── */}
      <div className="flex-1 overflow-y-auto py-10 px-6">
        <div className="space-y-1">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            const isPending = index > currentStepIndex;

            return (
              <div key={step.id} className="relative">
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[19px] top-10 w-[2px] h-12 transition-all duration-500',
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-100'
                    )}
                  />
                )}

                <div
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 group cursor-default',
                    isActive
                      ? 'bg-blue-50/50 shadow-sm border border-blue-100/50'
                      : 'opacity-70 hover:opacity-100'
                  )}
                >
                  {/* Icon/Status Indicator */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0 border-2',
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                        : isActive
                          ? 'bg-white border-[#2F5FA7] text-[#2F5FA7] shadow-xl shadow-blue-500/10 scale-110'
                          : 'bg-slate-50 border-slate-100 text-blue-100'
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 animate-in zoom-in duration-300" />
                    ) : (
                      <span className="text-xs font-black">{index + 1}</span>
                    )}
                  </div>

                  {/* Label & Status */}
                  <div className="pt-1">
                    <p
                      className={cn(
                        'text-[10px] font-black uppercase tracking-[0.15em] mb-0.5 transition-colors',
                        isActive ? 'text-[#2F5FA7]' : 'text-blue-100'
                      )}
                    >
                      {step.label}
                    </p>
                    <p
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-widest',
                        isCompleted
                          ? 'text-emerald-500'
                          : isActive
                            ? 'text-slate-600'
                            : 'text-slate-300'
                      )}
                    >
                      {isCompleted ? 'Complete' : isActive ? 'Current Step' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER HINT ── */}
      <div className="p-8 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 opacity-60">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <p className="text-[9px] font-bold text-blue-200 uppercase tracking-widest leading-relaxed">
            All data is autosaved to project cloud.
          </p>
        </div>
      </div>
    </div>
  );
}
