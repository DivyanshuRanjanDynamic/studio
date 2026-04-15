'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ManufacturingService } from '@/models/project.model';
import { Layers3, CheckCircle, Info } from 'lucide-react';
import { MATERIAL_CATALOG, MaterialOption } from '@/lib/data/material-data';
import { ExpertCTA } from './ExpertCTA';

interface MaterialSelectionProps {
  selectedService: ManufacturingService;
  selectedMaterial: {
    id: string;
    name: string;
    grade?: string;
    thickness?: number;
    canBend?: boolean;
    maxThicknessForBending?: number;
    canPowderCoat?: boolean;
    canAnodize?: boolean;
  } | null;
  onSelect: (material: {
    id: string;
    name: string;
    grade: string;
    thickness?: number;
    canBend?: boolean;
    maxThicknessForBending?: number;
    canPowderCoat?: boolean;
    canAnodize?: boolean;
  }) => void;
}

export function MaterialSelection({
  selectedService,
  selectedMaterial,
  onSelect,
}: MaterialSelectionProps) {
  const [expandedInfoId, setExpandedInfoId] = useState<string | null>(null);
  const serviceData = MATERIAL_CATALOG[selectedService];

  const MATERIAL_INFO: Record<string, string> = {
    'al-5052':
      'Good formability and corrosion resistance. Preferred for enclosures and bent sheet parts.',
    'al-6061': 'Strong and lightweight. Ideal when stiffness matters more than bendability.',
    'ms-crca': 'Cost-effective and rigid. Common for brackets, cabinets, and structural panels.',
    'ss-304': 'Excellent corrosion resistance and clean finish. Great for industrial environments.',
    'cf-plate': 'Very high stiffness-to-weight ratio. Used for lightweight performance components.',
    acrylic: 'Clear, clean, and easy to laser-cut. Great for display, covers, and visual panels.',
    mdf: 'Easy to machine for prototypes and jigs. Best for indoor non-structural use.',
    plywood: 'Stronger than MDF for many fixtures. Good for workshop-ready mockups and panels.',
    balsa: 'Ultra-light material for model-making and quick concept builds.',
    pla: 'Best for fast visual prototypes. Easy to print with clean dimensional results.',
    tpu: 'Flexible and impact-friendly. Suitable for grips, seals, and soft-contact components.',
    abs: 'Tough engineering plastic with better heat resistance than PLA.',
    petg: 'Balanced strength and chemical resistance, good for practical functional parts.',
    asa: 'UV and weather resistant, suitable for outdoor 3D printed components.',
    'al-6061-cnc':
      'A machining-grade aluminum that balances strength, weight, and excellent machinability.',
  };

  const getMaterialInfo = (material: MaterialOption) =>
    MATERIAL_INFO[material.id] ||
    material.notes ||
    `${material.name} (${material.grade}) is commonly used for industrial prototyping and production parts.`;

  if (!serviceData) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 text-sm">No materials available for this service.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-black uppercase tracking-wide text-slate-900 mb-1">
          Select Material
        </h3>
        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
          Choose stock for {selectedService.replace(/_/g, ' ')}
        </p>
      </div>

      <div className="space-y-8 pb-10">
        {serviceData.categories.map((category) => (
          <div key={category.name} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-slate-100" />
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2F5FA7] whitespace-nowrap">
                {category.name}
              </h4>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {category.materials.map((material: MaterialOption) => {
                const isSelected = selectedMaterial?.id === material.id;
                const isInfoOpen = expandedInfoId === material.id;

                return (
                  <div key={material.id} className="space-y-3">
                    <Card
                      className={`cursor-pointer transition-all duration-300 overflow-hidden group ${
                        isSelected
                          ? 'bg-blue-50 border-[#2F5FA7] shadow-[0_8px_20px_rgba(47,95,167,0.12)] ring-1 ring-[#2F5FA7]/20'
                          : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                      }`}
                      onClick={() =>
                        onSelect({ id: material.id, name: material.name, grade: material.grade })
                      }
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#2F5FA7] text-white border-[#2F5FA7]'
                                : 'bg-slate-50 text-[#2F5FA7] border-slate-100 group-hover:bg-white'
                            }`}
                          >
                            <Layers3 className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                                  {material.name}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                                  Grade: {material.grade}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {isSelected && !material.thicknesses && (
                                  <Badge className="bg-[#2F5FA7] text-white text-[8px] uppercase tracking-wider font-bold px-1.5 py-0 h-4 border-none">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Selected
                                  </Badge>
                                )}
                                <button
                                  type="button"
                                  aria-label={`More info about ${material.name}`}
                                  className={`h-7 w-7 rounded-md border flex items-center justify-center transition-colors ${
                                    isInfoOpen
                                      ? 'bg-blue-50 border-blue-200 text-[#2F5FA7]'
                                      : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:text-[#2F5FA7]'
                                  }`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setExpandedInfoId((prev) =>
                                      prev === material.id ? null : material.id
                                    );
                                  }}
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {isInfoOpen && (
                              <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2.5">
                                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">
                                  {getMaterialInfo(material)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Thickness Selection - Conditionally Rendered when material is selected and has thicknesses */}
                    {isSelected && material.thicknesses && (
                      <div className="pl-14 pr-2 pb-2 space-y-3 animate-in slide-in-from-top-2 duration-300 transition-all">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2F5FA7] flex items-center gap-2">
                          <CheckCircle className="w-3 h-3" /> Select Available Thickness (MM)
                        </p>

                        {(material.canBend === false ||
                          material.canPowderCoat === false ||
                          material.maxThicknessForBending) && (
                          <div className="flex flex-wrap gap-2 mb-1">
                            {material.canBend === false && (
                              <Badge
                                variant="outline"
                                className="text-[8px] uppercase font-bold tracking-tighter px-1.5 py-0 border-red-100 text-red-600 bg-red-50/50"
                              >
                                No Bending
                              </Badge>
                            )}
                            {material.canPowderCoat === false && (
                              <Badge
                                variant="outline"
                                className="text-[8px] uppercase font-bold tracking-tighter px-1.5 py-0 border-slate-200 text-slate-500 bg-slate-50"
                              >
                                No Powder Coating
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                          {material.thicknesses.map((thickness) => (
                            <button
                              key={thickness}
                              onClick={() =>
                                onSelect({
                                  id: material.id,
                                  name: material.name,
                                  grade: material.grade,
                                  thickness,
                                  ...(material as any), // Pass capabilities down
                                })
                              }
                              className={`h-10 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border transition-all ${
                                selectedMaterial.thickness === thickness
                                  ? 'bg-[#2F5FA7] text-white border-[#2F5FA7] shadow-md shadow-blue-500/20'
                                  : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200 hover:text-[#2F5FA7]'
                              }`}
                            >
                              <span>{thickness}</span>
                              {material.maxThicknessForBending &&
                                thickness > material.maxThicknessForBending && (
                                  <span className="text-[6px] opacity-70 uppercase tracking-tighter -mt-1 font-black">
                                    No Bend
                                  </span>
                                )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <ExpertCTA
        description="Looking for a specific material or thickness not listed above? Our procurement team can source custom materials for your project."
        buttonText="Inquire Material"
      />
    </div>
  );
}
