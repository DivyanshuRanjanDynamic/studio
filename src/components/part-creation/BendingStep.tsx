'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  CornerUpRight,
  Info,
  AlertCircle,
  Layers,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from 'lucide-react';
import { ConversionResult, BendFeature } from '@/types/viewer';
import { ManufacturingService } from '@/models/project.model';

interface BendingStepProps {
  selectedService: ManufacturingService;
  isBendingEnabled: boolean;
  onToggle: () => void;
  conversionResult: ConversionResult | null;
  selectedMaterial: {
    id: string;
    name: string;
    grade?: string;
    thickness?: number;
    canBend?: boolean;
    maxThicknessForBending?: number;
    [key: string]: any;
  } | null;
  /** Hovered bend index (shared with FlatPatternViewer) */
  hoveredBendIndex?: number;
  /** Callback when user hovers a bend in the table */
  onBendHover?: (index: number | undefined) => void;
}

export function BendingStep({
  selectedService,
  isBendingEnabled,
  onToggle,
  conversionResult,
  selectedMaterial,
  hoveredBendIndex,
  onBendHover,
}: BendingStepProps) {
  const normalizeDirection = (direction: string | undefined): 'UP' | 'DOWN' => {
    const value = (direction ?? '').trim().toUpperCase();
    if (value === 'DOWN' || value === 'D' || value === '-') return 'DOWN';
    return 'UP';
  };

  // Use unified conversion result for bends
  const bends: BendFeature[] = conversionResult?.bends ?? [];
  const normalizedBends: BendFeature[] = bends.map((bend) => ({
    ...bend,
    direction: normalizeDirection(bend.direction),
  }));
  const bendCount = bends.length;
  const detectedThickness = conversionResult?.detectedThickness ?? null;
  const hasFlatPattern = !!conversionResult?.flatPattern;

  // Capability check
  const cannotBend = !!(selectedMaterial?.canBend === false || (
    selectedMaterial?.maxThicknessForBending &&
    selectedMaterial?.thickness &&
    selectedMaterial?.thickness > selectedMaterial?.maxThicknessForBending
  ));

  // Thickness mismatch warning
  const thicknessMismatch = detectedThickness !== null &&
    selectedMaterial?.thickness !== undefined &&
    Math.abs(detectedThickness - selectedMaterial.thickness) > 0.3;

  // Bend stats
  const upBends = normalizedBends.filter((b) => b.direction === 'UP');
  const downBends = normalizedBends.filter((b) => b.direction === 'DOWN');
  const angles = normalizedBends.map((b) => b.angle);
  const minAngle = angles.length > 0 ? Math.min(...angles) : 0;
  const maxAngle = angles.length > 0 ? Math.max(...angles) : 0;

  if (selectedService !== 'sheet_metal_cutting') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-4">
          <CornerUpRight className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Bending Not Applicable</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          Bending is only available for Sheet Metal Cutting services.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
      <div>
        <h3 className="text-xl font-semibold text-slate-900 mb-1">
          Bending Configuration
        </h3>
        <p className="text-sm text-slate-500">
          Define sheet metal forming and folding requirements
        </p>
      </div>

      <Card
        className={`p-6 transition-all duration-300 overflow-hidden relative border ${isBendingEnabled
          ? 'bg-gradient-to-br from-white to-blue-50/40 border-blue-200 shadow-md'
          : 'bg-white border-slate-200 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${isBendingEnabled ? 'bg-[#2F5FA7] text-white shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-400'
              }`}>
              <CornerUpRight className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Enable Bending</p>
              <p className="text-xs text-slate-500">
                {isBendingEnabled ? 'Forming service active' : 'Enable for folded sheet parts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {cannotBend && (
              <Badge variant="destructive" className="text-[9px] uppercase tracking-tighter h-6">
                Material Limit
              </Badge>
            )}
            <Switch
              checked={isBendingEnabled}
              onCheckedChange={onToggle}
              disabled={cannotBend}
              className="data-[state=checked]:bg-[#2F5FA7]"
            />
          </div>
        </div>

        {isBendingEnabled && (
          <div className="mt-6 pt-5 border-t border-slate-200 animate-in zoom-in-95 fade-in duration-300">

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Bends</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-semibold text-slate-900 leading-none">{bendCount}</span>
                  <span className="text-[11px] text-slate-500 pb-0.5">total</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[11px] font-medium text-slate-500 mb-1">Direction</p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between px-2 py-1 rounded-md bg-blue-50">
                    <div className="flex items-center gap-1">
                      <ArrowUp className="w-3 h-3 text-blue-500" />

                    </div>
                    <span className="text-sm font-semibold text-blue-700">{upBends.length}</span>
                  </div>
                  <div className="flex items-center justify-between px-2 py-1 rounded-md bg-orange-50">
                    <div className="flex items-center gap-1">
                      <ArrowDown className="w-3 h-3 text-orange-500" />
                    </div>
                    <span className="text-sm font-semibold text-orange-700">{downBends.length}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-[11px] font-medium text-slate-500 mb-1">
                  {detectedThickness ? 'Thickness' : 'Analysis'}
                </p>
                {detectedThickness ? (
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-semibold text-slate-900 leading-none">{detectedThickness}</span>
                    <span className="text-[11px] text-slate-500 pb-0.5">mm</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-slate-700">Auto</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Thickness Mismatch Warning ── */}
            {thicknessMismatch && (
              <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-900 mb-1">
                    Thickness Mismatch
                  </p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    CAD detected {detectedThickness}mm but material is {selectedMaterial?.thickness}mm.
                    Verify your material selection matches the design intent.
                  </p>
                </div>
              </div>
            )}

            {/* ── Bend Details Table ── */}
            {bendCount > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-500 mb-3">
                  Bend Schedule
                </p>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-[40px_1fr_1.2fr_1fr] gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                    <span className="text-[11px] font-medium text-slate-500">#</span>
                    <span className="text-[11px] font-medium text-slate-500">Angle</span>
                    <span className="text-[11px] font-medium text-slate-500">Direction</span>
                    <span className="text-[11px] font-medium text-slate-500">Radius</span>
                  </div>
                  {/* Table Body */}
                  <div className="max-h-[180px] overflow-y-auto custom-scrollbar">
                    {normalizedBends.map((bend, idx) => {
                      const isHovered = hoveredBendIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`grid grid-cols-[40px_1fr_1.2fr_1fr] gap-2 px-4 py-2.5 border-b border-slate-100 transition-all duration-200 cursor-pointer ${isHovered
                            ? 'bg-blue-50/60 border-blue-100'
                            : 'hover:bg-slate-50'
                            }`}
                          onMouseEnter={() => onBendHover?.(idx)}
                          onMouseLeave={() => onBendHover?.(undefined)}
                        >
                          <span className="text-xs font-medium text-slate-500">{idx + 1}</span>
                          <span className="text-xs font-semibold text-slate-900 font-mono">{bend.angle.toFixed(1)}°</span>
                          <div className="flex items-center gap-1.5">
                            {bend.direction === 'UP' ? (
                              <ArrowUp className="w-3 h-3 text-blue-500" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-orange-500" />
                            )}
                            <span className={`text-[11px] font-medium ${bend.direction === 'UP' ? 'text-blue-600' : 'text-orange-600'
                              }`}>
                              {bend.direction}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-slate-700">
                            {bend.radius > 0 ? `R${bend.radius.toFixed(1)}` : 'Sharp'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Flat Pattern Status ── */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-600 leading-relaxed">
                {hasFlatPattern
                  ? 'A 2D flat pattern preview is shown on the left. Blue lines = UP bends, orange dashed lines = DOWN bends. Hover any line or row for details.'
                  : 'Our system has analyzed your STEP file. Blue lines indicate "UP" bends, while orange lines indicate "DOWN" bends in the technical preview.'
                }
              </p>
            </div>
          </div>
        )}
      </Card>

      {!isBendingEnabled && !cannotBend && (
        <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-start gap-4 transition-all hover:bg-slate-50">
          <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed mb-2">
              Note: Bending is optional. If your part is flat, you can skip this step and proceed to quantity selection.
            </p>
            {bendCount === 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="h-6 px-2 text-[8px] font-black uppercase text-[#2F5FA7] hover:bg-blue-50"
              >
                Manually Enable Bending Config
              </Button>
            )}
          </div>
        </div>
      )}

      {cannotBend && (
        <Card className="p-6 bg-red-50 border-red-100 border flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-900 uppercase tracking-widest mb-1">Material Restriction</p>
            <p className="text-[9px] font-bold text-red-700 uppercase tracking-widest leading-relaxed">
              Selected material ({selectedMaterial?.name}) exceeds the maximum bending thickness of {selectedMaterial?.maxThicknessForBending}mm.
            </p>
          </div>
        </Card>
      )}

      <div className="mt-12 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          <Layers className="w-4 h-4 text-[#2F5FA7]" />
          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Why specify bending?</p>
        </div>
        <p className="text-[10px] font-medium text-slate-500 leading-relaxed px-2">
          Bending adds significant structural value but increases production complexity. Specifying it here ensures your quote is generated with industrial precision.
        </p>
      </div>
    </div>
  );
}
