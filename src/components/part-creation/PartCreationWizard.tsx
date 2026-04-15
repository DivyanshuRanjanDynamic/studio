'use client';

import { cn } from '@/utils';
import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  useUser,
  useFirestore,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import {
  ManufacturingService,
  SecondaryProcess,
  TapSelection,
  ColorOption,
  MechanicalPart,
} from '@/models/project.model';
import { ConversionResult, BendAnalysisResult } from '@/types/viewer';
import { ServiceSelection } from './ServiceSelection';
import { FileUploadStep } from './FileUploadStep';
import { MaterialSelection } from './MaterialSelection';
import { SecondaryProcessSelection, SECONDARY_PROCESSES, COLOR_OPTIONS } from './SecondaryProcessSelection';
import { BendingStep } from './BendingStep';
import { QuantityStep } from './QuantityStep';
import { ThreadConfigSidebar } from './ThreadConfigSidebar';
import { isPartNameValid } from '@/lib/validation/part-name';
import { STLViewer } from '@/components/viewer/STLViewer';
import { FlatPatternViewer } from '@/components/viewer/FlatPatternViewer';
import { convertStepFile, stlBase64ToBuffer } from '@/services/stepConverter.service';

import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Layers,
  Upload,
  Palette,
  Hash,
  X,
  Plus,
  Loader2,
  Box,
  Monitor,
  CornerUpRight
} from 'lucide-react';

type WizardStep = 'service' | 'file' | 'material' | 'secondary' | 'bending' | 'quantity';

const STEPS: { id: WizardStep; label: string; icon: React.ReactNode }[] = [
  { id: 'service', label: 'Service', icon: <Layers className="w-4 h-4" /> },
  { id: 'file', label: 'Analysis', icon: <Upload className="w-4 h-4" /> },
  { id: 'material', label: 'Material', icon: <Monitor className="w-4 h-4" /> },
  { id: 'secondary', label: 'Finishing', icon: <Palette className="w-4 h-4" /> },
  { id: 'bending', label: 'Bending', icon: <CornerUpRight className="w-4 h-4" /> },
  { id: 'quantity', label: 'Quantity', icon: <Hash className="w-4 h-4" /> },
];

interface PartCreationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onPartCreated: (part: MechanicalPart) => void;
  standalone?: boolean;
}

export function PartCreationWizard({
  isOpen,
  onClose,
  projectId,
  onPartCreated,
  standalone = false,
}: PartCreationWizardProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<WizardStep>('service');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [partName, setPartName] = useState('');
  const [selectedService, setSelectedService] = useState<ManufacturingService | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
  } | null>(null);

  // CAD State (Persistent across steps)
  const [stlBuffer, setStlBuffer] = useState<ArrayBuffer | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState<{
    id: string;
    name: string;
    grade: string;
    thickness?: number;
    canBend?: boolean;
    maxThicknessForBending?: number;
    canPowderCoat?: boolean;
    canAnodize?: boolean;
  } | null>(null);
  const [secondaryProcesses, setSecondaryProcesses] = useState<SecondaryProcess[]>([]);
  const [coatingColor, setCoatingColor] = useState<ColorOption | null>(null);
  const [selectedTaps, setSelectedTaps] = useState<TapSelection[]>([]);
  const [hoveredHoleIndex, setHoveredHoleIndex] = useState<number | undefined>(undefined);
  const [tappingNotes, setTappingNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discountTier, setDiscountTier] = useState<string | null>(null);
  const [showTappingSidebar, setShowTappingSidebar] = useState(false);

  const [hoveredBendIndex, setHoveredBendIndex] = useState<number | undefined>(undefined);

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  // ── Auto-convert when reaching secondary step without conversion data ──────
  // This handles the case where the user uploaded a file before auto-conversion
  // was implemented, or when navigating back and forth through the wizard.
  useEffect(() => {
    if (
      (currentStep === 'secondary' || currentStep === 'material') &&
      !conversionResult &&
      !isConverting &&
      uploadedFile &&
      uploadedFile.fileName.match(/\.(step|stp)$/i)
    ) {
      // We need to fetch the file from S3 and convert it
      const autoConvert = async () => {
        try {
          setIsConverting(true);
          const token = await user?.getIdToken();
          if (!token) return;

          // Fetch the file from S3
          const response = await fetch(
            `/api/v1/files/retrieve?fileKey=${encodeURIComponent(uploadedFile.fileUrl)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (!response.ok) return;

          const blob = await response.blob();
          const file = new File([blob], uploadedFile.fileName, { type: 'application/octet-stream' });

          // Convert via CAD service
          const result = await convertStepFile(file);
          const buffer = stlBase64ToBuffer(result.stl);

          setConversionResult(result);
          setStlBuffer(buffer);
        } catch (err) {
          console.error('[Wizard] Auto-conversion failed:', err);
        } finally {
          setIsConverting(false);
        }
      };

      autoConvert();
    }
  }, [currentStep, conversionResult, isConverting, uploadedFile, user]);


  const canProceed = () => {
    switch (currentStep) {
      case 'service':
        return selectedService !== null && isPartNameValid(partName);
      case 'file':
        return uploadedFile !== null;
      case 'material':
        return selectedMaterial !== null;
      case 'secondary':
        // Secondary processes are optional
        // But if any selected process requires color, a color must be chosen
        const needsColor = secondaryProcesses.some(
          (pid) => (SECONDARY_PROCESSES as any[]).find((p) => p.id === pid)?.requiresColor
        );
        if (needsColor) {
          return coatingColor !== null;
        }
        return true;
      case 'bending':
        return true;
      case 'quantity':
        return quantity >= 1;
      default:
        return false;
    }
  };

  const handleNext = () => {
    let nextIndex = currentStepIndex + 1;

    // Skip secondary process step if no processes are applicable for the service
    if (STEPS[nextIndex]?.id === 'secondary' && selectedService) {
      const applicableProcesses = (SECONDARY_PROCESSES as any[]).filter((p) =>
        p.applicableServices.includes(selectedService)
      );
      if (applicableProcesses.length === 0) {
        nextIndex++;
      }
    }

    // Skip bending step for non-sheet-metal services
    if (STEPS[nextIndex]?.id === 'bending' && selectedService !== 'sheet_metal_cutting') {
      nextIndex++;
    }

    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const handleBack = () => {
    let prevIndex = currentStepIndex - 1;

    // Skip bending step for non-sheet-metal services
    if (STEPS[prevIndex]?.id === 'bending' && selectedService !== 'sheet_metal_cutting') {
      prevIndex--;
    }

    // Skip secondary process step if it was skipped during 'Next'
    if (STEPS[prevIndex]?.id === 'secondary' && selectedService) {
      const applicableProcesses = (SECONDARY_PROCESSES as any[]).filter((p) =>
        p.applicableServices.includes(selectedService)
      );
      if (applicableProcesses.length === 0) {
        prevIndex--;
      }
    }

    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const handleSecondaryProcessToggle = (process: SecondaryProcess) => {
    setSecondaryProcesses((prev) => {
      let updated: SecondaryProcess[];

      if (prev.includes(process)) {
        // Remove process
        updated = prev.filter((p) => p !== process);
      } else {
        // Add process
        updated = [...prev, process];

        // Logical Exclusion: powder_coating and anodizing are mutually exclusive
        if (process === 'powder_coating') {
          updated = updated.filter(p => p !== 'anodizing');
        } else if (process === 'anodizing') {
          updated = updated.filter(p => p !== 'powder_coating');
        } else if (process === 'tapping') {
          setShowTappingSidebar(true);
        }
      }

      // If tapping was removed
      if (!updated.includes('tapping')) {
        setShowTappingSidebar(false);
      }

      // Cleanup logic if color is no longer needed
      const remainingNeedsColor = updated.some(
        (pid) => (SECONDARY_PROCESSES as any[]).find((p) => p.id === pid)?.requiresColor
      );
      if (!remainingNeedsColor) {
        setCoatingColor(null);
      }

      return updated;
    });
  };

  const handleTapSelect = (holeIndex: number, tapType: string | null) => {
    setSelectedTaps((prev) => {
      const existing = prev.find((t) => t.holeIndex === holeIndex);
      if (tapType === null) {
        return prev.filter((t) => t.holeIndex !== holeIndex);
      }
      if (existing) {
        return prev.map((t) => (t.holeIndex === holeIndex ? { holeIndex, tapType } : t));
      }
      return [...prev, { holeIndex, tapType }];
    });
  };

  const handleResetTaps = () => {
    setSelectedTaps([]);
    setTappingNotes('');
  };

  const handleSubmit = async () => {
    if (!user || !db || !selectedService || !uploadedFile || !selectedMaterial) {
      toast({
        title: 'Error',
        description: 'Please complete all required fields',
        variant: 'destructive',
      });
      return;
    }
    if (!isPartNameValid(partName)) {
      toast({
        title: 'Invalid part name',
        description: 'Part name must include at least one letter and cannot be only numbers.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const partData: Omit<MechanicalPart, 'id'> = {
        projectId,
        userId: user.uid,
        partName: partName.trim(),
        service: selectedService,
        cadFile: {
          fileName: uploadedFile.fileName,
          fileUrl: uploadedFile.fileUrl,
          fileSize: uploadedFile.fileSize,
          uploadedAt: new Date().toISOString(),
        },
        material: selectedMaterial,
        secondaryProcesses,
        ...(coatingColor ? { coatingColor } : {}),
        ...(selectedTaps.length > 0 ? { taps: selectedTaps } : {}),
        ...(tappingNotes.trim() ? { tappingNotes: tappingNotes.trim() } : {}),
        ...(conversionResult?.boundingBox ? { dimensions: conversionResult.boundingBox } : {}),
        quantity,
        ...(discountTier ? { discountTier } : {}),
        status: 'ready_for_quote',
        analysis: conversionResult ? {
          holes: conversionResult.holes || [],
          bends: conversionResult.bends || [],
          triangleCount: conversionResult.triangleCount || 0,
          boundingBox: conversionResult.boundingBox,
          detectedThickness: conversionResult.detectedThickness,
          flatPattern: conversionResult.flatPattern,
        } : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };


      const partRef = await addDocumentNonBlocking(collection(db, 'projectParts'), partData);

      if (!partRef) {
        throw new Error('No part reference returned from database');
      }

      // Update project with the new part
      await updateDocumentNonBlocking(doc(db, 'projectRFQs', projectId), {
        updatedAt: new Date().toISOString(),
      });

      const newPart: MechanicalPart = {
        id: partRef.id,
        ...partData,
      };

      toast({
        title: 'Part Added Successfully',
        description: `Added ${quantity} unit(s) to your project`,
      });

      onPartCreated(newPart);
      handleClose();
    } catch (error) {
      console.error('Error creating part:', error);
      toast({
        title: 'Error',
        description: 'Failed to add part. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      // Reset state
      setCurrentStep('service');
      setPartName('');
      setSelectedService(null);
      setUploadedFile(null);
      setStlBuffer(null);
      setConversionResult(null);
      setSelectedMaterial(null);
      setSecondaryProcesses([]);
      setCoatingColor(null);
      setTappingNotes('');
      setQuantity(1);
      setDiscountTier(null);
      setShowTappingSidebar(false);
      setHoveredBendIndex(undefined);

      onClose();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'service':
        return (
          <ServiceSelection
            partName={partName}
            onPartNameChange={setPartName}
            selectedService={selectedService}
            onSelect={setSelectedService}
          />
        );
      case 'file':
        return (
          <FileUploadStep
            partName={partName}
            onPartNameChange={setPartName}
            uploadedFile={uploadedFile}
            onFileUpload={setUploadedFile}
            onClearFile={() => {
              setUploadedFile(null);
              setStlBuffer(null);
              setConversionResult(null);
            }}
            selectedService={selectedService}
            onConversionComplete={(buffer: ArrayBuffer, result: ConversionResult) => {
              setStlBuffer(buffer);
              setConversionResult(result);
            }}
            onConversionStart={() => setIsConverting(true)}
            onConversionEnd={() => setIsConverting(false)}
          />
        );
      case 'material':
        return selectedService ? (
          <MaterialSelection
            selectedService={selectedService}
            selectedMaterial={selectedMaterial}
            onSelect={setSelectedMaterial}
          />
        ) : null;
      case 'secondary':
        return selectedService ? (
          <SecondaryProcessSelection
            selectedService={selectedService}
            selectedMaterial={selectedMaterial}
            selectedProcesses={secondaryProcesses}
            coatingColor={coatingColor}
            onProcessToggle={handleSecondaryProcessToggle}
            onColorSelect={setCoatingColor}
            conversionResult={conversionResult}
            selectedTaps={selectedTaps}
            onTapSelect={handleTapSelect}
            onHoleHover={setHoveredHoleIndex}
            tappingNotes={tappingNotes}
            onTappingNotesChange={setTappingNotes}
            hideTappingPanel={secondaryProcesses.includes('tapping')} // Always true if tapping is enabled
            onOpenTappingConfig={() => setShowTappingSidebar(true)}
          />
        ) : null;
      case 'bending':
        return selectedService ? (
          <BendingStep
            selectedService={selectedService}
            selectedMaterial={selectedMaterial}
            isBendingEnabled={secondaryProcesses.includes('bending')}
            onToggle={() => handleSecondaryProcessToggle('bending')}
            conversionResult={conversionResult}
            hoveredBendIndex={hoveredBendIndex}
            onBendHover={setHoveredBendIndex}
          />
        ) : null;
      case 'quantity':
        return (
          <QuantityStep
            quantity={quantity}
            onQuantityChange={setQuantity}
            onDiscountTierChange={setDiscountTier}
          />
        );
      default:
        return null;
    }
  };

  const content = (
    <div className={cn(
      "flex flex-col bg-white overflow-hidden font-sans text-slate-600",
      standalone ? "h-screen w-full" : "h-full flex flex-col"
    )}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="h-20 px-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2F5FA7] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none mb-1">
                Design Configurator
              </h2>
              <p className="text-[10px] font-black text-[#2F5FA7] uppercase tracking-widest leading-none">
                Industrial Engineering Suite
              </p>
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 bg-slate-200" />

          {/* Stepper HUD - Improved responsiveness */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar px-4 flex-1">
            {STEPS.map((step, idx) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2.5 transition-all duration-300',
                  idx <= currentStepIndex ? 'opacity-100' : 'opacity-30'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all border shadow-sm',
                    idx === currentStepIndex
                      ? 'bg-white border-[#2F5FA7] text-[#2F5FA7] ring-4 ring-blue-50'
                      : idx < currentStepIndex
                        ? 'bg-[#2F5FA7] border-[#2F5FA7] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                  )}
                >
                  {idx < currentStepIndex ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'hidden lg:block text-[10px] font-black uppercase tracking-widest transition-colors',
                    idx === currentStepIndex ? 'text-slate-900' : 'text-slate-400'
                  )}
                >
                  {step.label}
                </span>
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'ml-2 w-1.5 h-1.5 rounded-full',
                      idx < currentStepIndex ? 'bg-[#2F5FA7]' : 'bg-slate-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={isSubmitting}
          className="ml-10 h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Main Work Area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden force-no-horizontal-scroll">
        {/* LEFT: Persistent Viewer (If file uploaded) */}
        <div className="flex-1 bg-slate-50 border-r border-slate-100 relative overflow-hidden flex items-center justify-center">
          {/* Show FlatPatternViewer on bending step when flat pattern is available */}
          {currentStep === 'bending' && conversionResult?.flatPattern ? (
            <FlatPatternViewer
              flatPattern={conversionResult.flatPattern}
              className="w-full h-full"
              hoveredBendIndex={hoveredBendIndex}
              onBendHover={setHoveredBendIndex}
              showBendLines={secondaryProcesses.includes('bending')}
            />
          ) : stlBuffer ? (
            <div className="w-full h-full relative">
              {(() => {
                // Logic to derive 3D viewer color and finish
                let viewerColor = '#94a3b8'; // Default slate gray
                let finishType: 'anodizing' | 'powder_coating' | 'raw' = 'raw';

                if (coatingColor) {
                  const colorOption = COLOR_OPTIONS.find((c) => c.id === coatingColor);
                  if (colorOption) {
                    viewerColor = colorOption.color;
                  }

                  if (secondaryProcesses.includes('anodizing')) {
                    finishType = 'anodizing';
                  } else if (secondaryProcesses.includes('powder_coating')) {
                    finishType = 'powder_coating';
                  }
                }

                return (
                  <STLViewer
                    buffer={stlBuffer}
                    className="w-full h-full"
                    color={viewerColor}
                    finishType={finishType}
                    holes={conversionResult?.holes}
                    bends={conversionResult?.bends}
                    showHoles={secondaryProcesses.includes('tapping')}
                    showBends={secondaryProcesses.includes('bending')}
                    hoveredHoleIndex={hoveredHoleIndex}
                    selectedHoleIndices={selectedTaps.map(t => t.holeIndex)}
                    boundingBox={conversionResult?.boundingBox}
                    serviceMode={
                      secondaryProcesses.includes('tapping') ? 'tapping' :
                        secondaryProcesses.includes('bending') ? 'bending' :
                          'none'
                    }
                  />
                );
              })()}

              {/* Floating Model Tags */}
              <div className="absolute top-14 left-6 flex flex-col gap-2">
                <div className="px-3 py-1.5 bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Part Name
                  </p>
                  <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[200px]">
                    {partName || 'Unit-01'}
                  </p>
                </div>
                {conversionResult && (
                  <div className="px-3 py-3bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg shadow-sm animate-in fade-in slide-in-from-left-2 duration-500">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Dimensions
                    </p>
                    <p className="text-[10px] font-black text-slate-900 uppercase">
                      {conversionResult.boundingBox.x} × {conversionResult.boundingBox.y} ×{' '}
                      {conversionResult.boundingBox.z} mm
                    </p>
                  </div>
                )}
              </div>

              {/* Industrial Overlays */}
            </div>
          ) : isConverting ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-[#2F5FA7] animate-spin" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Processing Geometry...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 max-w-sm text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-200">
                <Box className="w-6 h-6 text-slate-300" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">
                  Model Workspace
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                  Your design will appear here once the CAD file is analyzed.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar Configurator */}
        <div className="w-full md:w-[420px] bg-white flex flex-col shrink-0 border-l border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
            {renderStepContent()}
          </div>

          {/* Navigation Footer (Floating in Sidebar) */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
            {currentStepIndex > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="h-12 w-12 p-0 flex items-center justify-center border-slate-200 text-slate-600 rounded-xl hover:bg-white transition-all shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}

            {currentStepIndex < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="h-12 flex-1 tracking-widest uppercase text-[10px] font-black bg-[#2F5FA7] hover:bg-[#1E3A66] text-white shadow-xl shadow-blue-500/20 transition-all border-none rounded-xl flex items-center justify-center gap-2 group"
              >
                Next Step
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="h-12 flex-1 tracking-widest uppercase text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20 transition-all border-none rounded-xl flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Add to Project
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* EXTRA RIGHT: Thread Configuration Panel */}
        {currentStep === 'secondary' && secondaryProcesses.includes('tapping') && showTappingSidebar && (
          <ThreadConfigSidebar
            conversionResult={conversionResult}
            selectedTaps={selectedTaps}
            onTapSelect={handleTapSelect}
            onHoleHover={setHoveredHoleIndex}
            tappingNotes={tappingNotes}
            onTappingNotesChange={setTappingNotes}
            onResetAll={handleResetTaps}
            onClose={() => setShowTappingSidebar(false)}
          />
        )}
      </div>
    </div>
  );

  if (standalone) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "w-full h-[95vh] p-0 overflow-hidden bg-white border-0 shadow-2xl flex flex-col rounded-[32px] transition-all duration-500",
        currentStep === 'secondary' && secondaryProcesses.includes('tapping')
          ? "max-w-[95vw] lg:max-w-[1600px]"
          : "max-w-[95vw] lg:max-w-[1280px]"
      )}>
        {/* Accessibility Requirements */}
        <div className="sr-only">
          <DialogTitle>Part Creation Wizard</DialogTitle>
          <DialogDescription>Configure your manufacturing part with real-time 3D feedback.</DialogDescription>
        </div>
        {content}
      </DialogContent>
    </Dialog>
  );
}
