'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MechHubLoader } from '@/components/ui/mechhub-loader';
import {
  Upload,
  FileText,
  ChevronRight,
  Loader2,
  X,
  Check,
  CloudUpload,
  Layers,
  Cog,
  ArrowRight,
  Paperclip,
  Trash2,
  Shield,
} from 'lucide-react';
import { MANUFACTURING_PROCESSES, MATERIALS, FINISHES, TOLERANCES } from '../lib/mock-data';
import { LandingNav } from '@/components/LandingNav';

interface DesignFile {
  name: string;
  size: number;
  dataUrl: string;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_FORMATS = '.step,.stp,.stl,.dxf,.pdf,.jpg,.png,.iges,.obj,.dwg';
const FORMAT_LABELS = ['STEP', 'STL', 'DXF', 'PDF', 'IGES', 'OBJ', 'DWG', 'JPG', 'PNG'];

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [files, setFiles] = useState<DesignFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const remaining = MAX_FILES - files.length;
      const toProcess = Array.from(fileList).slice(0, remaining);

      toProcess.forEach((file) => {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          setFiles((prev) => {
            if (prev.some((f) => f.name === file.name)) return prev;
            if (prev.length >= MAX_FILES) return prev;
            return [
              ...prev,
              { name: file.name, size: file.size, dataUrl: event.target?.result as string },
            ];
          });
        };
        reader.readAsDataURL(file);
      });
    },
    [files.length]
  );

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleNextStep = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
    }, 1500);
  };

  const handleDetailsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const designFiles = files.map((f) => ({ name: f.name, size: f.size, dataUrl: f.dataUrl }));

    const details = {
      projectName: formData.get('projectName'),
      processes: selectedProcesses,
      material: formData.get('material'),
      thickness: formData.get('thickness'),
      weight: formData.get('weight'),
      quantity: formData.get('quantity'),
      surfaceFinish: formData.get('surfaceFinish'),
      tolerance: formData.get('tolerance'),
      deliveryDate: formData.get('deliveryDate'),
      budget: formData.get('budget'),
      location: formData.get('location'),
      extraRequirements: formData.get('extraRequirements'),
      designFileName: files[0]?.name ?? null,
      designFileUrl: files[0]?.dataUrl ?? null,
      designFiles,
    };

    localStorage.setItem('pendingRfqDetails', JSON.stringify(details));
    router.push('/matching');
  };

  const getFileExtension = (name: string) => {
    const ext = name.split('.').pop()?.toUpperCase() || 'FILE';
    return ext.length > 4 ? ext.slice(0, 4) : ext;
  };

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="min-h-screen pt-24 pb-16 bg-[#020617] text-zinc-300 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5 pointer-events-none" />
      <LandingNav />
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        {/* ── Step indicator ── */}
        <div className="flex items-center justify-center gap-2 mb-14">
          {[
            { num: 1, label: 'Upload Designs', icon: CloudUpload },
            { num: 2, label: 'Requirements', icon: Cog },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-12 sm:w-20 transition-colors duration-500 ${step >= s.num ? 'bg-cyan-500' : 'bg-white/10'}`}
                />
              )}
              <div className="flex items-center gap-2.5">
                <div
                  className={`
                  w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500
                  ${step > s.num ? 'bg-cyan-500 text-[#020617]' : step === s.num ? 'bg-cyan-500 text-[#020617] shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-white/5 text-zinc-500 border border-white/10'}
                `}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-sm  tracking-widest uppercase hidden sm:inline transition-colors ${step >= s.num ? 'text-white' : 'text-zinc-500'}`}
                >
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════════════ STEP 1: Upload ══════════════════════ */}
        {step === 1 && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center mb-2">
              <h1 className=" text-3xl sm:text-4xl font-bold text-white tracking-wide">
                Upload Your Design Files
              </h1>
              <p className="text-cyan-50/50 font-consolas mt-2 text-sm sm:text-base">
                Share your engineering drawings for instant matching with verified manufacturers.
              </p>
            </div>

            {/* Drop zone */}
            <div
              className={`
                relative rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md shadow-[0_0_40px_rgba(34,211,238,0.03)]
                ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-500/10 scale-[1.02] shadow-[0_0_50px_rgba(34,211,238,0.1)]'
                    : files.length > 0
                      ? 'border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400/50'
                      : 'border-white/10 hover:border-cyan-500/40 bg-[#040f25]/40'
                }
              `}
              onClick={() =>
                files.length < MAX_FILES && document.getElementById('fileInput')?.click()
              }
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="fileInput"
                className="hidden"
                onChange={handleFilesChange}
                accept={ACCEPTED_FORMATS}
                multiple
              />

              <div className="py-20 px-8 flex flex-col items-center text-center relative z-10">
                <div
                  className={`
                  w-24 h-24 rounded-3xl flex items-center justify-center mb-6 transition-all duration-500
                  ${isDragging ? 'bg-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'bg-cyan-950/40 border border-cyan-500/10'}
                `}
                >
                  <CloudUpload
                    className={`w-12 h-12 transition-all duration-500 ${isDragging ? 'text-cyan-400 scale-110' : 'text-cyan-500/50'}`}
                  />
                </div>

                <p className="text-xl  tracking-wider text-white mb-2">
                  {isDragging
                    ? 'Release to upload'
                    : files.length === 0
                      ? 'Drag & drop files here'
                      : 'Add more files'}
                </p>
                <p className="text-sm font-consolas text-zinc-400 mb-6">
                  or{' '}
                  <span className="text-cyan-400 font-bold underline underline-offset-4 hover:text-cyan-300 transition-colors">
                    browse from device
                  </span>
                </p>

                {/* Accepted formats */}
                <div className="flex flex-wrap justify-center gap-1.5">
                  {FORMAT_LABELS.map((fmt) => (
                    <span
                      key={fmt}
                      className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 bg-white/5 px-2.5 py-1 rounded-full border border-white/5"
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-bold text-white">
                      {files.length} {files.length === 1 ? 'file' : 'files'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      • {(totalSize / 1024 / 1024).toFixed(1)} MB total
                    </span>
                  </div>
                  {files.length < MAX_FILES && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary hover:text-primary/80 gap-1.5"
                      onClick={() => document.getElementById('fileInput')?.click()}
                    >
                      <Paperclip className="w-3.5 h-3.5" /> Add more
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5">
                  {files.map((f, idx) => (
                    <div
                      key={f.name}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#040f25]/40 border border-white/5 group hover:border-cyan-500/30 hover:bg-cyan-950/20 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                      style={{ animationDelay: `${idx * 60}ms` }}
                    >
                      {/* Extension badge */}
                      <div className="w-10 h-10 rounded-lg bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center shrink-0 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/40 transition-colors">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-consolas">
                          {getFileExtension(f.name)}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-cyan-50 transition-colors">
                          {f.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-consolas">
                          {(f.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(f.name);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security note + CTA */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 font-consolas">
                <Shield className="w-3.5 h-3.5 text-cyan-500" />
                <span>Your files are encrypted and shared only with verified MechMasters</span>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-base font-bold gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={files.length === 0 || isProcessing}
                onClick={handleNextStep}
                suppressHydrationWarning
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
                    Analyzing {files.length} {files.length === 1 ? 'design' : 'designs'}…
                  </>
                ) : (
                  <>
                    Continue to Requirements
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ══════════════════════ STEP 2: Details ══════════════════════ */}
        {step === 2 && (
          <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
            <Card className="bg-zinc-950/60 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl">
              {/* Header with gradient accent */}
              <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />
              <CardHeader className="pb-4 pt-8 px-8">
                <CardTitle className=" text-2xl font-bold text-white tracking-wide">
                  Manufacturing Specifications
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Configure tolerances, materials, and delivery for precision matching.
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8 pb-8">
                <form onSubmit={handleDetailsSubmit} className="space-y-8">
                  {/* Project Name — full width, prominent */}
                  <div className="space-y-3">
                    <Label className="text-[11px] font-bold tracking-[0.2em] text-cyan-400 uppercase">
                      Project Name
                    </Label>
                    <Input
                      name="projectName"
                      placeholder="e.g. Robot Arm Rev 2"
                      required
                      className="bg-[#020617] border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 h-14 text-base font-medium text-white placeholder:text-zinc-600 rounded-xl"
                    />
                  </div>

                  <div className="h-px bg-white/5" />

                  {/* Technical specs grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2 space-y-3">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Manufacturing Processes{' '}
                        <span className="text-cyan-400">(Select Multiple)</span>
                      </Label>
                      <div className="flex flex-wrap gap-2.5">
                        {MANUFACTURING_PROCESSES.map((p) => {
                          const isSelected = selectedProcesses.includes(p);
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() =>
                                setSelectedProcesses((prev) =>
                                  isSelected ? prev.filter((x) => x !== p) : [...prev, p]
                                )
                              }
                              className={`px-4 py-2.5 rounded-xl text-[11px] font-bold tracking-wide transition-all border ${
                                isSelected
                                  ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:bg-cyan-500/30 hover:border-cyan-400'
                                  : 'bg-[#020617]/50 text-zinc-400 border-white/10 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              {p}
                            </button>
                          );
                        })}
                      </div>
                      {selectedProcesses.length === 0 && (
                        <input
                          type="text"
                          name="process_validation"
                          required
                          className="opacity-0 absolute h-0 w-0 pointer-events-none"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Material Requirements
                      </Label>
                      <Select name="material" required>
                        <SelectTrigger className="bg-[#020617] border-white/10 h-12 text-zinc-300 rounded-xl focus:ring-cyan-500/20 hover:border-white/20 transition-colors">
                          <SelectValue placeholder="e.g. Aluminum 6061-T6" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-zinc-300">
                          {MATERIALS.map((m) => (
                            <SelectItem
                              key={m}
                              value={m}
                              className="focus:bg-cyan-950/50 focus:text-cyan-100 cursor-pointer"
                            >
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Material Thickness
                      </Label>
                      <Input
                        name="thickness"
                        placeholder="e.g. 5mm, 0.25 inch"
                        required
                        className="bg-[#020617] border-white/10 h-12 rounded-xl text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Quantity
                      </Label>
                      <Input
                        name="quantity"
                        type="number"
                        min={1}
                        placeholder="Number of units"
                        required
                        className="bg-[#020617] border-white/10 h-12 rounded-xl text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Estimated Weight{' '}
                        <span className="text-zinc-600 font-normal normal-case tracking-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        name="weight"
                        placeholder="e.g. 2.5 kg"
                        className="bg-[#020617] border-white/10 h-12 rounded-xl text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Surface Finish{' '}
                        <span className="text-zinc-600 font-normal normal-case tracking-normal">
                          (optional)
                        </span>
                      </Label>
                      <Select name="surfaceFinish">
                        <SelectTrigger className="bg-[#020617] border-white/10 h-12 text-zinc-300 rounded-xl focus:ring-cyan-500/20 hover:border-white/20 transition-colors">
                          <SelectValue placeholder="Select finish" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-zinc-300">
                          {FINISHES.map((f) => (
                            <SelectItem
                              key={f}
                              value={f}
                              className="focus:bg-cyan-950/50 focus:text-cyan-100 cursor-pointer"
                            >
                              {f}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Tolerance Requirement
                      </Label>
                      <Select name="tolerance" required>
                        <SelectTrigger className="bg-[#020617] border-white/10 h-12 text-zinc-300 rounded-xl focus:ring-cyan-500/20 hover:border-white/20 transition-colors">
                          <SelectValue placeholder="Select tolerance" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-zinc-300">
                          {TOLERANCES.map((t) => (
                            <SelectItem
                              key={t}
                              value={t}
                              className="focus:bg-cyan-950/50 focus:text-cyan-100 cursor-pointer"
                            >
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Required Delivery Date
                      </Label>
                      <Input
                        name="deliveryDate"
                        type="date"
                        required
                        className="bg-[#020617] border-white/10 h-12 rounded-xl text-white focus:border-cyan-500/50 focus:ring-cyan-500/20 [color-scheme:dark]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Budget Range{' '}
                        <span className="text-zinc-600 font-normal normal-case tracking-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        name="budget"
                        placeholder="e.g. ₹10,000 – ₹50,000"
                        className="bg-[#020617] border-white/10 h-12 rounded-xl text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Delivery Location
                      </Label>
                      <Input
                        name="location"
                        placeholder="City, Pincode"
                        required
                        className="bg-[#020617] border-white/10 h-12 rounded-xl text-white placeholder:text-zinc-600 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      />
                    </div>

                    {/* Extra Requirements */}
                    <div className="space-y-3 md:col-span-2">
                      <Label className="text-[11px] font-bold tracking-[0.1em] text-zinc-400 uppercase">
                        Extra Requirements & Notes{' '}
                        <span className="text-zinc-600 font-normal normal-case tracking-normal">
                          (optional)
                        </span>
                      </Label>
                      <textarea
                        name="extraRequirements"
                        placeholder="Explain any specific instructions, post-processing notes, or assembly requirements here..."
                        className="w-full bg-[#020617] border border-white/10 focus:border-cyan-500/50 focus:ring-cyan-500/20 rounded-xl p-4 text-sm text-white placeholder:text-zinc-600 min-h-[120px] resize-y outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8" />

                  {/* Attached files summary */}
                  <div className="rounded-xl bg-[#040f25]/40 border border-white/5 p-5 shadow-inner">
                    <div className="flex items-center gap-2 mb-4">
                      <Paperclip className="w-4 h-4 text-cyan-500" />
                      <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
                        Attached Designs ({files.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {files.map((f) => (
                        <div
                          key={f.name}
                          className="flex items-center gap-2 bg-zinc-950/80 border border-white/10 px-3 py-2 rounded-lg shadow-sm"
                        >
                          <div className="w-6 h-6 rounded bg-cyan-950/50 border border-cyan-500/20 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-cyan-400 uppercase">
                              {getFileExtension(f.name)}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-200 font-medium truncate max-w-[150px]">
                            {f.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-consolas">
                            {(f.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-14 text-base font-bold gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all mt-4"
                    suppressHydrationWarning
                  >
                    Find Best-Fit MechMasters
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
