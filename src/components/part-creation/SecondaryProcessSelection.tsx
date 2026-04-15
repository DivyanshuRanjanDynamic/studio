'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from "@/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ManufacturingService,
  SecondaryProcess,
  TapSelection,
  ColorOption,
} from '@/models/project.model';
import { ConversionResult } from '@/types/viewer';
import {
  Paintbrush,
  CornerUpRight,
  Sparkles,
  Shield,
  Chrome,
  Wind,
  CheckCircle,
  Flame,
  Zap,
  MousePointer2,
  TableProperties,
  ChevronDown,
  Info,
} from 'lucide-react';
import { ExpertCTA } from './ExpertCTA';

export interface SecondaryProcessOption {
  id: SecondaryProcess;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresColor?: boolean;
  applicableServices: ManufacturingService[];
}

export const SECONDARY_PROCESSES: SecondaryProcessOption[] = [
  {
    id: 'powder_coating',
    name: 'Powder Coating',
    description: 'Durable, eco-friendly coating in various colors',
    icon: <Paintbrush className="w-5 h-5" />,
    requiresColor: true,
    applicableServices: ['sheet_metal_cutting', 'cnc_turning'],
  },
  {
    id: 'anodizing',
    name: 'Anodizing',
    description: 'Includes free media blasting',
    icon: <Sparkles className="w-5 h-5" />,
    requiresColor: true,
    applicableServices: ['cnc_turning', 'sheet_metal_cutting'],
  },
  {
    id: 'chrome_plating',
    name: 'Chrome Plating',
    description: 'Decorative and protective chrome finish',
    icon: <Chrome className="w-5 h-5" />,
    applicableServices: ['cnc_turning'],
  },
  {
    id: 'sand_blasting',
    name: 'Sand Blasting',
    description: 'Surface texturing and cleaning',
    icon: <Wind className="w-5 h-5" />,
    applicableServices: ['cnc_turning', '3d_printing'],
  },
  {
    id: 'heat_treatment',
    name: 'Heat Treatment',
    description: 'Hardening or softening the material',
    icon: <Flame className="w-5 h-5" />,
    applicableServices: ['cnc_turning', 'wire_edm'],
  },
  {
    id: 'nickel_plating',
    name: 'Nickel Plating',
    description: 'Wear and corrosion resistance',
    icon: <Zap className="w-5 h-5" />,
    applicableServices: ['cnc_turning'],
  },
  {
    id: 'tapping',
    name: 'Tapping',
    description: 'Internal threads for fasteners',
    icon: <TableProperties className="w-5 h-5" />,
    applicableServices: ['sheet_metal_cutting', 'cnc_machining', 'cnc_turning'],
  },
];

import {
  ALL_TAPS,
  METRIC_TAPS,
  IMPERIAL_TAPS
} from '@/config/manufacturing';


const mmToInch = (mm: number) => mm / 25.4;

export const COLOR_OPTIONS: {
  id: ColorOption;
  name: string;
  color: string;
  applicableProcesses: SecondaryProcess[];
}[] = [
    {
      id: 'black',
      name: 'Black',
      color: '#1a1a1a',
      applicableProcesses: ['powder_coating', 'anodizing'],
    },
    {
      id: 'blue',
      name: 'Blue',
      color: '#2563eb',
      applicableProcesses: ['powder_coating', 'anodizing'],
    },
    {
      id: 'clear',
      name: 'Clear',
      color: '#e2e8f0',
      applicableProcesses: ['powder_coating', 'anodizing']
    },
    {
      id: 'gold',
      name: 'Gold',
      color: '#fbbf24',
      applicableProcesses: ['powder_coating', 'anodizing']
    },
    {
      id: 'red',
      name: 'Red',
      color: '#dc2626',
      applicableProcesses: ['powder_coating', 'anodizing'],
    },
  ];

interface SecondaryProcessSelectionProps {
  selectedService: ManufacturingService;
  selectedMaterial: {
    id: string;
    name: string;
    grade?: string;
    thickness?: number;
    canBend?: boolean;
    canPowderCoat?: boolean;
    canAnodize?: boolean;
    maxThicknessForBending?: number;
  } | null;
  selectedProcesses: SecondaryProcess[];
  coatingColor: ColorOption | null;
  onProcessToggle: (process: SecondaryProcess) => void;
  onColorSelect: (color: ColorOption) => void;
  conversionResult: ConversionResult | null;
  selectedTaps: TapSelection[];
  onTapSelect: (holeIndex: number, tapType: string | null) => void;
  onHoleHover: (holeIndex: number | undefined) => void;
  tappingNotes?: string;
  onTappingNotesChange?: (notes: string) => void;
  hideTappingPanel?: boolean;
  onOpenTappingConfig?: () => void;
}

export function SecondaryProcessSelection({
  selectedService,
  selectedMaterial,
  selectedProcesses,
  coatingColor,
  onProcessToggle,
  onColorSelect,
  conversionResult,
  selectedTaps,
  onTapSelect,
  onHoleHover,
  tappingNotes = '',
  onTappingNotesChange,
  hideTappingPanel = false,
  onOpenTappingConfig,
}: SecondaryProcessSelectionProps) {
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const filteredProcesses = SECONDARY_PROCESSES.filter((p) => {
    // Basic service check
    if (!p.applicableServices.includes(selectedService)) return false;

    // Capability-based checks
    if (selectedMaterial) {
      if (p.id === 'bending') {
        if (selectedMaterial.canBend === false) return false;
        if (
          selectedMaterial.maxThicknessForBending &&
          selectedMaterial.thickness &&
          selectedMaterial.thickness > selectedMaterial.maxThicknessForBending
        ) {
          return false;
        }
      }
      if (p.id === 'powder_coating' && selectedMaterial.canPowderCoat === false) return false;
      if (p.id === 'anodizing' && selectedMaterial.canAnodize === false) return false;
    }

    return true;
  });

  const needsColor = selectedProcesses.some(
    (pid: SecondaryProcess) => SECONDARY_PROCESSES.find((p) => p.id === pid)?.requiresColor
  );

  const activeColorProcesses = selectedProcesses.filter(
    (pid: SecondaryProcess) => SECONDARY_PROCESSES.find((p) => p.id === pid)?.requiresColor
  );

  const availableColors = COLOR_OPTIONS.filter((color) =>
    color.applicableProcesses.some((ap) => activeColorProcesses.includes(ap))
  );

  // Group taps for summary
  const tapSummary = selectedTaps.reduce((acc, tap) => {
    acc[tap.tapType] = (acc[tap.tapType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasTaps = Object.keys(tapSummary).length > 0;
  const hasNotes = tappingNotes && tappingNotes.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-black uppercase tracking-wide text-slate-900 mb-1">
          Secondary Processes
        </h3>
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
          Optional treatments for your {selectedService.replace(/_/g, ' ')} part
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 pb-6">
        {filteredProcesses.map((process) => {
          const isSelected = selectedProcesses.includes(process.id);

          return (
            <Card
              key={process.id}
              className={`cursor-pointer transition-all duration-300 overflow-hidden ${isSelected
                ? 'bg-blue-50 border-[#2F5FA7] ring-1 ring-[#2F5FA7]/20'
                : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                }`}
              onClick={() => onProcessToggle(process.id)}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onProcessToggle(process.id)}
                    className="mt-1 data-[state=checked]:bg-[#2F5FA7] data-[state=checked]:border-[#2F5FA7]"
                  />
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#2F5FA7] text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                  >
                    {process.icon}
                  </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                          {process.name}
                        </p>
                        {process.id === 'tapping' && isSelected && onOpenTappingConfig && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenTappingConfig();
                            }}
                            className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-[#2F5FA7] hover:bg-blue-100/50 rounded-md"
                          >
                            Configure
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                        {process.description}
                      </p>

                      {/* Thread Summary List */}
                      {process.id === 'tapping' && isSelected && (hasTaps || hasNotes) && (
                        <div className="mt-3 flex flex-wrap gap-1.5 animate-in fade-in slide-in-from-left-2 duration-300">
                          {Object.entries(tapSummary).map(([type, count]) => (
                            <div
                              key={type}
                              className="flex items-center gap-1.5 px-2 py-1 bg-blue-100/50 border border-blue-200/50 rounded-lg shadow-sm"
                            >
                              <span className="text-[9px] font-black text-[#2F5FA7] lining-nums">
                                {count}x
                              </span>
                              <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">
                                {type}
                              </span>
                            </div>
                          ))}
                          {hasNotes && !hasTaps && (
                            <div className="px-2 py-1 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-1.5">
                              <MousePointer2 className="w-2.5 h-2.5 text-amber-500" />
                              <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest">
                                Manual Specs Provided
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {needsColor && (
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#2F5FA7] text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 border-none">
              <Paintbrush className="w-3 h-3 mr-1" />
              Finish Color Required
            </Badge>
          </div>

          <div>
            <Label className="text-[10px] uppercase text-[#2F5FA7] font-bold tracking-widest mb-3 block">
              Selection ({activeColorProcesses.map((p: SecondaryProcess) => p.replace('_', ' ')).join(' & ')})
            </Label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
              {availableColors.map((colorOption) => (
                <button
                  key={colorOption.id}
                  type="button"
                  onClick={() => onColorSelect(colorOption.id)}
                  className={`group relative w-full aspect-square rounded-xl border-2 transition-all duration-200 ${coatingColor === colorOption.id
                    ? 'border-[#2F5FA7] ring-2 ring-[#2F5FA7]/20 scale-105'
                    : 'border-slate-200 hover:border-slate-300'
                    }`}
                  style={{ backgroundColor: colorOption.color }}
                >
                  {coatingColor === colorOption.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {coatingColor && (
              <p className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                Selected: {COLOR_OPTIONS.find((c) => c.id === coatingColor)?.name}
              </p>
            )}
          </div>
        </div>
      )}

      {selectedProcesses.includes('tapping') && !hideTappingPanel && (!conversionResult?.holes || conversionResult.holes.length === 0) && (
        <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500 text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 border-none">
              <TableProperties className="w-3 h-3 mr-1" />
              Manual Tapping Setup Required
            </Badge>
          </div>

          {/* Guidance Card */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2">Threading / Tapping Setup</p>
            <p className="text-[9px] text-amber-700 leading-relaxed">
              We couldn't automatically detect holes in your part. Please describe how your part should be tapped below.
              For the fastest turnaround, model holes as simple circles matching the drill diameter for your desired tap size.
            </p>
          </div>

          {/* Important Note */}
          <div className="flex items-start gap-2 p-3 bg-blue-50/80 border border-blue-100 rounded-xl">
            <Info className="w-3.5 h-3.5 text-[#2F5FA7] shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-blue-800 leading-normal uppercase tracking-wider">
              Please don't model threads in your file. Select your desired tap size from the reference table below, and describe where tapping is needed.
            </p>
          </div>

          {/* Customer Input */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#2F5FA7] flex items-center gap-2">
              <MousePointer2 className="w-3.5 h-3.5" />
              Describe Your Tapping Requirements
            </Label>
            <textarea
              value={tappingNotes}
              onChange={(e) => onTappingNotesChange?.(e.target.value)}
              placeholder="E.g., '4x M6 holes along the top flange, 2x M8 holes on the mounting bracket...'"
              className="w-full min-h-[100px] p-3 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl resize-y focus:border-[#2F5FA7] focus:ring-1 focus:ring-[#2F5FA7]/20 focus:outline-none transition-all placeholder:text-slate-400 placeholder:text-[10px] placeholder:italic"
            />
            <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold italic pl-1">
              Include hole positions, quantities, and desired thread sizes
            </p>
          </div>

          {/* Reference Tap Chart */}
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Available Thread/Tap Sizes</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              {/* Metric Column */}
              <div className="bg-white">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[8px] font-black text-[#2F5FA7] uppercase tracking-widest">Metric</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {METRIC_TAPS.map(tap => (
                    <div key={tap.id} className="px-3 py-1.5 flex justify-between items-center hover:bg-blue-50/50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-700">{tap.name}</span>
                      <span className="text-[9px] font-mono text-slate-400">{tap.drillSize}mm</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Imperial Column */}
              <div className="bg-white">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[8px] font-black text-[#2F5FA7] uppercase tracking-widest">SAE / Imperial</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {IMPERIAL_TAPS.map(tap => (
                    <div key={tap.id} className="px-3 py-1.5 flex justify-between items-center hover:bg-blue-50/50 transition-colors">
                      <span className="text-[10px] font-bold text-slate-700">{tap.name}</span>
                      <span className="text-[9px] font-mono text-slate-400">{tap.drillSize}mm</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProcesses.includes('tapping') && !hideTappingPanel && conversionResult?.holes && conversionResult.holes.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between">
            <Badge className="bg-[#2F5FA7] text-white text-[10px] uppercase tracking-wider font-bold px-2 py-1 border-none">
              <TableProperties className="w-3 h-3 mr-1" />
              Thread Configuration
            </Badge>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              {conversionResult.holes.length} Holes Detected
            </span>
          </div>

          <div className="rounded-xl border border-slate-100 overflow-hidden bg-slate-50/50">
            <div className="grid grid-cols-4 px-4 py-2 bg-slate-100/50 border-b border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase">Diameter (Ø)</span>
              <span className="text-[8px] font-black text-slate-400 uppercase">Depth</span>
              <span className="text-[8px] font-black text-slate-500 uppercase col-span-2">Feature / Thread Selection</span>
            </div>

            <div className="divide-y divide-slate-100">
              {conversionResult.holes.map((hole, idx) => {
                const selection = selectedTaps.find(t => t.holeIndex === idx);
                const diamMm = hole.radius * 2;
                const diamInch = mmToInch(diamMm);
                const depthInch = mmToInch(hole.depth);

                // Industrial Matching logic: suggest threads with drill size within ±0.4mm
                const recommendedTaps = ALL_TAPS.filter(t =>
                  Math.abs(t.drillSize - diamMm) < 0.45
                );

                return (
                  <div
                    key={idx}
                    className={cn(
                      "grid grid-cols-4 px-4 py-4 items-center transition-all duration-300",
                      selection ? "bg-blue-50/40" : "hover:bg-white"
                    )}
                    onMouseEnter={() => onHoleHover(idx)}
                    onMouseLeave={() => onHoleHover(undefined)}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 tracking-tight">{diamInch.toFixed(4)}"</span>
                      <span className="text-[8px] font-bold text-slate-400 tabular-nums">{diamMm.toFixed(2)}mm</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-900 tracking-tight">{depthInch.toFixed(3)}"</span>
                      <span className="text-[8px] font-bold text-slate-400 tabular-nums">{hole.depth.toFixed(1)}mm</span>
                    </div>

                    <div className="col-span-2 flex justify-end">
                      <Popover 
                        open={openPopoverIndex === idx} 
                        onOpenChange={(open) => setOpenPopoverIndex(open ? idx : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant={selection ? "default" : "outline"}
                            className={cn(
                              "h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2 rounded-lg border-2 transition-all duration-300",
                              selection
                                ? "bg-[#2F5FA7] hover:bg-[#1E3E6F] text-white border-transparent shadow-lg shadow-blue-900/20"
                                : "bg-white border-slate-200 hover:border-[#2F5FA7] hover:text-[#2F5FA7] text-slate-600"
                            )}
                          >
                            {selection ? selection.tapType : "Select Tap"}
                            <ChevronDown className={cn("w-3 h-3 transition-transform duration-300", selection ? "text-white/70" : "text-slate-400")} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2 bg-white/95 backdrop-blur-xl border-slate-200 shadow-2xl rounded-xl z-[9000]" align="end">
                          <div className="space-y-1">
                            <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[#2F5FA7]">Recommended Taps</p>
                            </div>

                            {recommendedTaps.length > 0 ? (
                              recommendedTaps.map(tap => (
                                <button
                                  key={tap.id}
                                  onClick={() => {
                                    onTapSelect(idx, tap.id);
                                    setOpenPopoverIndex(null);
                                  }}
                                  className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold rounded-lg transition-all",
                                    selection?.tapType === tap.id
                                      ? "bg-blue-50 text-[#2F5FA7]"
                                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                  )}
                                >
                                  <span className="uppercase">{tap.name}</span>
                                  <span className="text-[8px] font-black text-slate-300 uppercase">Drill: {tap.drillSize}mm</span>
                                </button>
                              ))
                            ) : (
                              <p className="px-3 py-4 text-[10px] text-slate-400 italic text-center">No auto-match for {diamMm.toFixed(2)}mm</p>
                            )}

                            <div className="px-2 py-1.5 border-t border-slate-100 mt-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">All Industrial Taps</p>
                            </div>
                            <div className="max-h-[160px] overflow-y-auto custom-scrollbar overflow-x-hidden py-1">
                              {ALL_TAPS.filter(t => !recommendedTaps.find(r => r.id === t.id)).map(tap => (
                                <button
                                  key={tap.id}
                                  onClick={() => {
                                    onTapSelect(idx, tap.id);
                                    setOpenPopoverIndex(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[9px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-all uppercase"
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
                                className="w-full h-8 mt-2 text-red-500 hover:text-red-600 hover:bg-red-50 text-[9px] font-black uppercase tracking-tighter rounded-lg"
                              >
                                Remove Thread Config
                              </Button>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <MousePointer2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] font-bold text-amber-700 leading-normal uppercase tracking-wider">
              Pro Tip: Please don't model threads in your part file. Select them above for higher precision.
            </p>
          </div>
        </div>
      )}

      {filteredProcesses.length === 0 && (
        <div className="text-center py-6">
          <p className="text-xs text-slate-500 italic uppercase tracking-wider">
            No secondary processes available for this service.
          </p>
        </div>
      )}

      <ExpertCTA
        description="Need a specialized surface treatment or plating not listed? Our engineering experts handle complex custom finishing requirements."
        buttonText="Consult Finishing"
      />
    </div>
  );
}
