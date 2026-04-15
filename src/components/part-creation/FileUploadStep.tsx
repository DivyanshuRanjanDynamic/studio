'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  FileType,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  Box,
  Tag,
  Info,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MechanicalPart, ManufacturingService } from '@/models/project.model';
import { useStepConverter } from '@/hooks/use-step-converter';
import { CADPreviewModal } from '@/components/viewer/CADPreviewModal';
import { ConversionResult } from '@/types/viewer';
import { Eye } from 'lucide-react';
import { useUser } from '@/firebase';

interface FileUploadStepProps {
  partName: string;
  onPartNameChange: (name: string) => void;
  uploadedFile: { fileName: string; fileUrl: string; fileSize: number } | null;
  onFileUpload: (file: { fileName: string; fileUrl: string; fileSize: number }) => void;
  onClearFile: () => void;
  selectedService: ManufacturingService | null;
  onConversionComplete?: (buffer: ArrayBuffer, result: ConversionResult) => void;
  onConversionStart?: () => void;
  onConversionEnd?: () => void;
}

const STEP_EXTENSIONS = ['.step', '.stp'];
const MESH_EXTENSIONS = ['.stl', '.obj'];
const ALLOWED_EXTENSIONS = [...STEP_EXTENSIONS, ...MESH_EXTENSIONS].flatMap((e) => [
  e,
  e.toUpperCase(),
]);
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUploadStep({
  partName,
  onPartNameChange,
  uploadedFile,
  onFileUpload,
  onClearFile,
  selectedService,
  onConversionComplete,
  onConversionStart,
  onConversionEnd,
}: FileUploadStepProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { isConverting, result, stlBuffer, convertFile } = useStepConverter();

  // Sync conversion status with parent wizard
  useEffect(() => {
    if (isConverting) {
      onConversionStart?.();
    } else {
      onConversionEnd?.();
    }
  }, [isConverting, onConversionStart, onConversionEnd]);

  useEffect(() => {
    if (stlBuffer && result) {
      onConversionComplete?.(stlBuffer, result);
    }
  }, [stlBuffer, result, onConversionComplete]);

  const isStepFile = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return STEP_EXTENSIONS.includes(ext);
  };

  const isMeshFile = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return MESH_EXTENSIONS.includes(ext);
  };

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => ext.toLowerCase() === extension);

    if (!hasAllowedExtension) {
      toast({
        title: 'Invalid File Format',
        description: 'Supported formats: STEP, STP, STL, OBJ',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 50MB.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const uploadToS3 = (file: File, uploadUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`S3 upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        console.error(
          'S3 Upload Network Error. This is usually caused by missing CORS configuration on the S3 bucket.'
        );
        console.error('Target URL:', uploadUrl.split('?')[0]); // Log the base URL for debugging
        reject(
          new Error(
            'S3 upload failed due to network error. Please ensure CORS is configured on your S3 bucket.'
          )
        );
      };
      xhr.send(file);
    });
  };

  const handleFile = async (file: File) => {
    if (!validateFile(file)) return;
    setLastFile(file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Step 1: Get presigned URL
      const response = await fetch('/api/v1/files/upload-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type || 'application/octet-stream',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get upload intent');
      }

      const { uploadUrl, fileKey } = await response.json();

      // Step 2: Upload to S3
      await uploadToS3(file, uploadUrl);

      setIsUploading(false);
      setIsValidating(true);

      // Step 3: Minimal validation delay (placeholder for real server-side processing start)
      await new Promise((r) => setTimeout(r, 800));

      onFileUpload({
        fileName: file.name,
        fileUrl: fileKey, // In S3 we store the key/path
        fileSize: file.size,
      });

      toast({
        title: 'File Uploaded Successfully',
        description: 'Your file has been securely uploaded and is ready for production.',
      });

      // Step 4: Auto-trigger CAD conversion for STEP files
      // This ensures holes and bends are detected BEFORE the user reaches the secondary processes step
      if (isStepFile(file)) {
        convertFile(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description:
          error instanceof Error
            ? error.message
            : 'There was an error uploading your file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setIsValidating(false);
      setUploadProgress(0);
    }

  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = ''; // Reset input
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold uppercase tracking-wide text-slate-900 mb-2">
          Upload 3D Design
        </h3>
        <p className="text-xs uppercase tracking-widest font-bold text-slate-500">
          Upload your STEP OR STP file to get started
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#2F5FA7] flex items-center gap-2">
            <Tag className="w-3.5 h-3.5" />
            Part Identity
          </Label>
          <Input
            placeholder="e.g. Main Bracket, Mounting Plate v2"
            value={partName}
            onChange={(e) => onPartNameChange(e.target.value)}
            className="h-12 border-slate-200 focus:border-[#2F5FA7] focus:ring-[#2F5FA7]/20 uppercase text-xs tracking-wider font-bold"
          />
          <p className="text-[8px] text-slate-400 uppercase tracking-widest font-bold italic pl-1">
            Give your part a descriptive name for internal tracking
          </p>
        </div>

        <div className="h-px bg-slate-100 my-2" />

        <div className="space-y-2">
          <Label className="text-[10px] uppercase font-bold tracking-[0.15em] text-[#2F5FA7] flex items-center gap-2">
            <Box className="w-3.5 h-3.5" />
            Geometry File (STEP/STP)
          </Label>

          {!uploadedFile ? (
            <div className="space-y-4">
              <Card
                className={`border-2 border-dashed transition-all duration-300 relative overflow-hidden cursor-pointer ${dragActive
                  ? 'border-[#2F5FA7] bg-blue-50'
                  : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-8 text-center flex flex-col items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-sm ${dragActive
                      ? 'bg-[#2F5FA7] text-white border-[#2F5FA7]'
                      : 'bg-blue-50 text-[#2F5FA7] border-blue-100'
                      }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : isValidating ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#2F5FA7]" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-2 text-[#2F5FA7] animate-pulse">
                          Validating File
                        </span>
                      </div>
                    ) : (
                      <UploadCloud className="w-8 h-8" />
                    )}
                  </div>

                  <div>
                    <p className="font-bold text-slate-900 uppercase tracking-wide text-sm">
                      {isUploading ? 'Uploading Design...' : 'Drop your design file here'}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                      {isUploading
                        ? `${Math.round(uploadProgress)}% completed`
                        : 'or click to browse from files'}
                    </p>
                  </div>

                  {isUploading && (
                    <div className="w-full max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-[#2F5FA7] transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}

                  {!isUploading && !isValidating && (
                    <div className="flex gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className="text-[8px] uppercase font-bold tracking-tighter px-1.5 py-0"
                      >
                        STEP
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[8px] uppercase font-bold tracking-tighter px-1.5 py-0"
                      >
                        STP
                      </Badge>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".step,.stp"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Card className="bg-blue-50 border-[#2F5FA7]/20 border relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#2F5FA7]" />
                <div className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-blue-100 text-[#2F5FA7] shadow-sm shrink-0">
                    <Box className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-slate-900 uppercase tracking-wide text-xs truncate">
                        {uploadedFile.fileName}
                      </p>
                      <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] uppercase tracking-wider font-bold px-1.5 py-0 h-4 border-none">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Validated
                      </Badge>
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                      {formatFileSize(uploadedFile.fileSize)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[9px] font-black uppercase tracking-widest border-[#2F5FA7]/30 text-[#2F5FA7] hover:bg-[#2F5FA7] hover:text-white transition-all gap-1.5"
                      disabled={isConverting}
                      onClick={async (e) => {
                        e.stopPropagation();

                        // Case 1: Local file session exists
                        if (lastFile) {
                          if (!stlBuffer) {
                            await convertFile(lastFile);
                          }
                          setIsPreviewOpen(true);
                          return;
                        }

                        // Case 2: File exists on S3 but local session is gone
                        if (uploadedFile?.fileUrl) {
                          try {
                            if (!stlBuffer) {
                              const token = await user?.getIdToken();
                              if (!token) throw new Error('Authorization required');

                              // 1. Fetch file directly from our secure S3 proxy
                              const response = await fetch(
                                `/api/v1/files/retrieve?fileKey=${encodeURIComponent(uploadedFile.fileUrl)}`,
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );

                              if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(errorData.error || 'Could not get access to file');
                              }

                              // 2. Convert
                              const blob = await response.blob();
                              const file = new File([blob], uploadedFile.fileName, {
                                type: 'application/octet-stream',
                              });
                              await convertFile(file);
                            }
                            setIsPreviewOpen(true);
                          } catch (err: any) {
                            toast({
                              title: 'Preview Failed',
                              description: err.message || 'Could not retrieve file from S3.',
                              variant: 'destructive',
                            });
                          }
                          return;
                        }

                        // Case 3: No file at all
                        toast({
                          title: 'File Session Expired',
                          description: 'Please re-upload your file to view 3D preview.',
                          variant: 'destructive',
                        });
                      }}
                    >
                      {isConverting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                      Preview 3D
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-red-50 text-slate-400 hover:text-red-500 w-8 h-8"
                      onClick={onClearFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <CADPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        stlBuffer={stlBuffer}
        result={result}
        fileName={uploadedFile?.fileName}
        isConverting={isConverting}
      />

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-[#2F5FA7] mt-0.5" />
        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold leading-relaxed">
          Technical design files are handled securely. Our manufacturing experts will review your
          files to ensure production readiness.
        </p>
      </div>
    </div>
  );
}
