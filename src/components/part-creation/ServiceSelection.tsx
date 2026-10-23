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

const SERVICES: (ServiceOption & { description: string })[] = [
  {
    id: 'cnc_machining',
    name: 'CNC Milling / Turning',
    description: 'Tight tolerances, metal & plastic',
    icon: <Cog className="w-6 h-6" />,
    popular: true,
  },
  {
    id: 'sheet_metal_cutting',
    name: 'Sheet Metal Cutting',
    description: 'Laser cut, bent & formed',
    icon: <Flame className="w-6 h-6" />,
    popular: true,
  },
  {
    id: '3d_printing',
    name: '3D Printing',
    description: 'FDM / SLA rapid prototypes',
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
      <div className="mb-6">
        <h3 className="text-2xl text-lp-fg mb-1">
          Part <span className="font-lp-serif italic text-lp-primary">configuration</span>
        </h3>
        <p className="lp-label-mono text-lp-muted-fg">
          Name your part and pick a service
        </p>
      </div>

      <div className="space-y-2 mb-8 p-4 bg-lp-accent rounded-sm border border-lp-border">
        <Label
          htmlFor="partName"
          className="lp-label-mono text-lp-primary flex items-center gap-1.5"
        >
          <CircleDot className="w-3.5 h-3.5" />
          Part Name
        </Label>
        <Input
          id="partName"
          value={partName}
          onChange={(e) => onPartNameChange(e.target.value)}
          placeholder="e.g. Support Bracket – V2"
          className="h-11 border-lp-border bg-lp-card text-sm text-lp-fg placeholder:text-lp-muted-fg"
          aria-invalid={showPartNameError}
          autoFocus
        />
        {showPartNameError && (
          <p className="text-[10px] text-red-600 font-bold tracking-wide">
            Part name must include at least one letter (not only numbers).
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Label className="lp-label-mono text-lp-muted-fg">
            Manufacturing Service
          </Label>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {SERVICES.map((service, idx) => (
            <Card
              key={service.id}
              className={`cursor-pointer transition-all duration-300 overflow-hidden relative group rounded-sm ${selectedService === service.id
                  ? 'bg-lp-accent border-lp-primary shadow-sm ring-1 ring-lp-primary/20'
                  : 'bg-lp-card border-lp-border hover:border-lp-primary/40 hover:bg-lp-accent'
                }`}
              onClick={() => onSelect(service.id)}
            >
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-lp-mono text-lp-muted-fg">{String(idx + 1).padStart(2, '0')}.</span>
                  <div
                    className={`w-10 h-10 rounded-sm flex items-center justify-center transition-colors ${selectedService === service.id
                        ? 'text-lp-primary'
                        : 'text-lp-muted-fg group-hover:text-lp-primary'
                      }`}
                  >
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-lp-fg text-sm">
                      {service.name}
                    </p>
                    <p className="text-xs text-lp-muted-fg mt-0.5">
                      {service.description}
                    </p>
                  </div>
                </div>
              </div>
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
