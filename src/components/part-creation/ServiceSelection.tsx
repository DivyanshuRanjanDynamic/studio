import { ManufacturingService } from '@/models/project.model';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Cog, Flame, Hammer, Box, Move3d, CircleDot } from 'lucide-react';
import { ExpertCTA } from './ExpertCTA';
import { isPartNameValid } from '@/lib/validation/part-name';

interface ServiceOption {
  id: ManufacturingService;
  name: string;
  icon: React.ReactNode;
  popular?: boolean;
}

const SERVICES: ServiceOption[] = [
  {
    id: 'cnc_machining',
    name: 'CNC Milling/Turning',
    icon: <Cog className="w-6 h-6" />,
    popular: true,
  },
  {
    id: 'sheet_metal_cutting',
    name: 'Sheet Metal Cutting',
    icon: <Flame className="w-6 h-6" />,
    popular: true,
  },
  {
    id: '3d_printing',
    name: '3D Printing',
    icon: <Box className="w-6 h-6" />,
  },
];

interface ServiceSelectionProps {
  partName: string;
  onPartNameChange: (name: string) => void;
  selectedService: ManufacturingService | null;
  onSelect: (service: ManufacturingService) => void;
}

export function ServiceSelection({
  partName,
  onPartNameChange,
  selectedService,
  onSelect,
}: ServiceSelectionProps) {
  const showPartNameError = partName.trim().length > 0 && !isPartNameValid(partName);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold uppercase tracking-wide text-slate-900 mb-2">
          Part Configuration
        </h3>
        <p className="text-xs uppercase tracking-widest font-bold text-slate-500">
          Name your part and select manufacturing service
        </p>
      </div>

      <div className="space-y-2 mb-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
        <Label
          htmlFor="partName"
          className="text-[10px] uppercase text-[#2F5FA7] font-bold tracking-widest"
        >
          Part Name
        </Label>
        <Input
          id="partName"
          value={partName}
          onChange={(e) => onPartNameChange(e.target.value)}
          placeholder="e.g., Support Bracket - V2"
          className="h-11 border-slate-200 bg-white text-sm uppercase tracking-wider font-bold text-slate-900 placeholder:font-normal placeholder:normal-case"
          aria-invalid={showPartNameError}
          autoFocus
        />
        {showPartNameError && (
          <p className="text-[10px] text-red-600 font-bold tracking-wide">
            Part name must include at least one letter (not only numbers).
          </p>
        )}
        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">
          Give this component a descriptive name for your quote
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
            Select Manufacturing Service
          </Label>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {SERVICES.map((service) => (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all duration-300 overflow-hidden relative group ${selectedService === service.id
                  ? 'bg-blue-50 border-[#2F5FA7] shadow-[0_10px_30px_rgba(47,95,167,0.15)] ring-1 ring-[#2F5FA7]/20'
                  : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                }`}
              onClick={() => onSelect(service.id)}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-5 h-6 rounded-xl flex items-center justify-center border shadow-sm transition-colors ${selectedService === service.id
                        ? 'bg-[#2F5FA7] text-white border-[#2F5FA7]'
                        : 'bg-slate-50 text-[#2F5FA7] border-slate-100 group-hover:bg-blue-50'
                      }`}
                  >
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-2">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold  text-slate-900 uppercase tracking-wide text-sm justify-center items-center">
                        {service.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedService === service.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2F5FA7]" />
              )}
            </Card>
          ))}
        </div>
      </div>

      <ExpertCTA
        description="Providing elite manufacturing for precision parts. If your required service is not listed, our experts can help with custom fabrication."
        buttonText="Contact Expert"
        className="mt-4"
      />
    </div>
  );
}
