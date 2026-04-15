'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils";
import {
  TableProperties,
  ChevronDown,
  Info,
  MousePointer2,
  X,
  Target
} from 'lucide-react';
import { ALL_TAPS, METRIC_TAPS, IMPERIAL_TAPS } from '@/config/manufacturing';
import { ConversionResult } from '@/types/viewer';
import { TapSelection } from '@/models/project.model';
import { ExpertCTA } from './ExpertCTA';

// Tapping standards moved to @/config/manufacturing
const mmToInch = (mm: number) => mm / 25.4;

interface ThreadConfigSidebarProps {
  conversionResult: ConversionResult | null;
  selectedTaps: TapSelection[];
  onTapSelect: (holeIndex: number, tapType: string | null) => void;
  onHoleHover: (holeIndex: number | undefined) => void;
  tappingNotes: string;
  onTappingNotesChange: (notes: string) => void;
  onResetAll: () => void;
  onClose: () => void;
}

export function ThreadConfigSidebar({
  conversionResult,
  selectedTaps,
  onTapSelect,
  onHoleHover,
  tappingNotes,
  onTappingNotesChange,
  onResetAll,
  onClose
}: ThreadConfigSidebarProps) {
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const hasHoles = conversionResult?.holes && conversionResult.holes.length > 0;

  return (
    <div className="w-[380px] bg-white border-l border-slate-100 flex flex-col h-full animate-in slide-in-from-right duration-500 shadow-2xl z-30">
      {/* Header */}
      <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
            <TableProperties className="w-4 h-4 text-[#2F5FA7]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none mb-1">
              Thread Configuration
            </h3>
            <p className="text-[9px] font-bold text-[#2F5FA7] uppercase tracking-widest leading-none">
              Properties Inspector
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {!hasHoles ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100/50">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Target className="w-3.5 h-3.5 text-white" />
                </div>
                <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Manual Setup</p>
              </div>
              <p className="text-[10px] font-bold text-amber-700/80 leading-relaxed uppercase tracking-wider">
                Automatic detection failed. Please describe hole positions and sizes below for manual processing.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-[9px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2 px-1">
                <MousePointer2 className="w-3 h-3" />
                Requirements
              </Label>
              <textarea
                value={tappingNotes}
                onChange={(e) => onTappingNotesChange(e.target.value)}
                placeholder="E.g., 4x M6 holes on top flange..."
                className="w-full min-h-[140px] p-4 text-[11px] font-bold text-slate-700 bg-slate-50/50 border border-slate-100 rounded-2xl resize-none focus:bg-white focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-300 placeholder:italic"
              />
            </div>

            <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Reference Thread Chart</p>
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-100">
                <div className="p-3 space-y-2">
                  <p className="text-[8px] font-black text-[#2F5FA7] uppercase tracking-widest mb-2 border-b border-blue-50 pb-1 text-center">Metric</p>
                  {METRIC_TAPS.slice(0, 8).map(tap => (
                    <div key={tap.id} className="flex justify-between items-center text-[9px]">
                      <span className="font-bold text-slate-600 uppercase">{tap.name}</span>
                      <span className="font-mono text-slate-300">{tap.drillSize}mm</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-[8px] font-black text-[#2F5FA7] uppercase tracking-widest mb-2 border-b border-blue-50 pb-1 text-center">Imperial</p>
                  {IMPERIAL_TAPS.slice(0, 8).map(tap => (
                    <div key={tap.id} className="flex justify-between items-center text-[9px]">
                      <span className="font-bold text-slate-600 uppercase">{tap.name}</span>
                      <span className="font-mono text-slate-300">{tap.drillSize}mm</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Analyzed Geometry
              </span>
              <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-400 px-2 py-0 h-5">
                {conversionResult?.holes?.length ?? 0} FEATURES
              </Badge>
            </div>

            <div className="space-y-3">
              {conversionResult?.holes?.map((hole, idx) => {
                const selection = selectedTaps.find(t => t.holeIndex === idx);
                const diamMm = hole.radius * 2;
                const diamInch = mmToInch(diamMm);
                const depthInch = mmToInch(hole.depth);

                const recommendedTaps = ALL_TAPS.filter(t =>
                  Math.abs(t.drillSize - diamMm) < 0.45
                );

                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all duration-300",
                      selection
                        ? "bg-blue-50/50 border-[#2F5FA7] shadow-lg shadow-blue-500/5 scale-[1.02]"
                        : "bg-white border-slate-100 hover:border-slate-300"
                    )}
                    onMouseEnter={() => onHoleHover(idx)}
                    onMouseLeave={() => onHoleHover(undefined)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <p className="text-[11px] font-black text-slate-900 leading-tight tabular-nums">{diamInch.toFixed(4)}"</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter tabular-nums">{diamMm.toFixed(2)}mm DIA</p>
                        </div>
                        <div className="h-6 w-px bg-slate-100" />
                        <div className="flex flex-col">
                          <p className="text-[11px] font-black text-slate-900 leading-tight tabular-nums">{depthInch.toFixed(3)}"</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter tabular-nums">{hole.depth.toFixed(1)}mm DEP</p>
                        </div>
                      </div>

                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-500",
                        selection ? "bg-[#2F5FA7] border-[#2F5FA7] text-white" : "border-slate-200 text-transparent"
                      )}>
                        <Target className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    <Popover 
                      open={openPopoverIndex === idx} 
                      onOpenChange={(open) => setOpenPopoverIndex(open ? idx : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant={selection ? "default" : "outline"}
                          className={cn(
                            "w-full h-10 text-[10px] font-black uppercase tracking-widest gap-2 rounded-xl border-2 transition-all duration-300",
                            selection
                              ? "bg-[#2F5FA7] text-white border-transparent"
                              : "bg-white border-slate-200 hover:border-[#2F5FA7] hover:text-[#2F5FA7]"
                          )}
                        >
                          {selection ? selection.tapType : "Select Thread Type"}
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[320px] p-2 bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl rounded-2xl z-[9999]" align="end">
                        <div className="space-y-1">
                          <div className="px-3 py-2 border-b border-slate-100 mb-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#2F5FA7]">Recommended Standards</p>
                          </div>

                          <div className="grid grid-cols-2 gap-1 px-1">
                            {recommendedTaps.length > 0 ? (
                              recommendedTaps.map(tap => (
                                <button
                                  key={tap.id}
                                  onClick={() => {
                                    onTapSelect(idx, tap.id);
                                    setOpenPopoverIndex(null);
                                  }}
                                  className={cn(
                                    "flex flex-col px-3 py-2 text-left rounded-xl transition-all",
                                    selection?.tapType === tap.id
                                      ? "bg-blue-50 border border-blue-100"
                                      : "hover:bg-slate-50 border border-transparent"
                                  )}
                                >
                                  <span className="text-[10px] font-black text-slate-900 uppercase">{tap.name}</span>
                                  <span className="text-[8px] font-bold text-slate-400 uppercase">Drill: {tap.drillSize}mm</span>
                                </button>
                              ))
                            ) : (
                              <p className="col-span-2 px-3 py-4 text-[9px] text-slate-400 italic text-center font-bold">No automatic matches</p>
                            )}
                          </div>

                          <div className="px-3 py-2 border-t border-slate-100 mt-2 mb-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All Industrial Taps</p>
                          </div>
                          <div className="max-h-[200px] overflow-y-auto custom-scrollbar px-2 grid grid-cols-2 gap-1 py-1">
                            {ALL_TAPS.map(tap => (
                              <button
                                key={tap.id}
                                onClick={() => {
                                  onTapSelect(idx, tap.id);
                                  setOpenPopoverIndex(null);
                                }}
                                className={cn(
                                  "px-3 py-2 text-[9px] font-bold rounded-lg transition-all text-left uppercase border",
                                  selection?.tapType === tap.id
                                    ? "bg-blue-50 border-blue-100 text-[#2F5FA7]"
                                    : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                )}
                              >
                                {tap.name}
                              </button>
                            ))}
                          </div>

                          {selection && (
                            <Button
                              variant="ghost"
                              onClick={() => {
                                onTapSelect(idx, null);
                                setOpenPopoverIndex(null);
                              }}
                              className="w-full h-10 mt-2 text-red-500 hover:text-red-700 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest rounded-xl"
                            >
                              Reset Configuration
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-4 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                  Missing holes?
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="space-y-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Please describe how your part should be tapped. <span className="text-[#2F5FA7] underline cursor-pointer hover:text-blue-700 transition-colors">Full tapping catalog</span>
                </p>
                <textarea
                  value={tappingNotes}
                  onChange={(e) => onTappingNotesChange(e.target.value)}
                  placeholder="Tapping note"
                  className="w-full min-h-[100px] p-4 text-[11px] font-bold text-slate-700 bg-slate-50/50 border border-slate-100 rounded-2xl resize-none focus:bg-white focus:border-[#2F5FA7] focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          onClick={onResetAll}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 hover:bg-slate-50 px-4 h-11 rounded-xl"
        >
          Reset All
        </Button>
        <Button
          onClick={onClose}
          className="flex-1 bg-[#2F5FA7] hover:bg-[#1E3A66] text-white text-[10px] font-black uppercase tracking-[0.2em] h-11 rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]"
        >
          Done
        </Button>
      </div>
    </div>
  );
}
