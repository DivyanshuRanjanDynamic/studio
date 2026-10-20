'use client';

// ═══════════════════════════════════════════════════
// use-file-upload — Multi-file upload with deduplication
// Generates SHA-256 hash, tracks progress per file.
// ═══════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import type { UploadedFile, ParsedGeometry, FileStatus } from '@/types/quoting';

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ACCEPTED_EXTENSIONS = ['.dxf', '.step', '.stp', '.stl'];

export interface UseFileUploadReturn {
  files: readonly UploadedFile[];
  isDragging: boolean;
  activeFileId: string | null;
  activeGeometry: ParsedGeometry | null;
  /** Original File for the active upload — needed by /analyze-cnc */
  activeRawFile: File | null;
  // Actions
  handleFileDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (id: string) => void;
  setActiveFile: (id: string) => void;
  setDragging: (dragging: boolean) => void;
  // State
  acceptedFormats: string;
  maxFiles: number;
  canAddMore: boolean;
}

/**
 * Generates a SHA-256 hash of a file using Web Crypto API.
 */
async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates simulated geometry from file metadata.
 * In production, this would come from the Python parsing backend.
 */
function generateSimulatedGeometry(fileName: string, fileSizeBytes: number): ParsedGeometry {
  // Deterministic "random" based on filename hash
  const seed = fileName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const pseudoRandom = (offset: number): number =>
    (((seed + offset) * 9301 + 49297) % 233280) / 233280;

  const width = 50 + pseudoRandom(1) * 400; // 50–450mm
  const height = 50 + pseudoRandom(2) * 400; // 50–450mm
  const cutLength = (width + height) * 2 + pseudoRandom(3) * 500;
  const area = width * height * (0.3 + pseudoRandom(4) * 0.5);
  const holeCount = Math.floor(pseudoRandom(5) * 12);
  const nodeCount = 4 + Math.floor(pseudoRandom(6) * 200);
  const complexity = Math.min(10, nodeCount / 20);

  return {
    cutLengthMm: Math.round(cutLength),
    areaMm2: Math.round(area),
    boundingBox: {
      widthMm: Math.round(width),
      heightMm: Math.round(height),
      aspectRatio: Math.round((width / height) * 100) / 100,
    },
    holeCount,
    complexityScore: Math.round(complexity * 10) / 10,
    nodeCount,
    minFeatureSizeMm: 1.5 + pseudoRandom(7) * 5,
    minSlotWidthMm: 2.0 + pseudoRandom(8) * 5,
    edgeToHoleDistanceMm: 2.0 + pseudoRandom(9) * 8,
    hasOpenPaths: false,
  };
}

export function useFileUpload(): UseFileUploadReturn {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const fileIdCounter = useRef(0);
  // File objects aren't serialisable state; keep them beside the metadata.
  const rawFiles = useRef(new Map<string, File>());

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const remaining = MAX_FILES - files.length;
      const toProcess = Array.from(fileList).slice(0, remaining);

      for (const file of toProcess) {
        // Validate size
        if (file.size > MAX_FILE_SIZE_BYTES) {
          continue;
        }

        // Validate extension
        const ext = '.' + (file.name.split('.').pop()?.toLowerCase() ?? '');
        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
          continue;
        }

        // Generate hash for deduplication
        const hash = await hashFile(file);

        // Check for duplicates
        if (files.some((f) => f.sha256Hash === hash)) {
          continue;
        }

        const id = `file_${++fileIdCounter.current}_${Date.now()}`;
        const geometry = generateSimulatedGeometry(file.name, file.size);

        const uploadedFile: UploadedFile = {
          id,
          fileName: file.name,
          fileSizeBytes: file.size,
          sha256Hash: hash,
          status: 'ready' as FileStatus,
          geometry,
          dfmIssues: [],
          uploadProgress: 100,
        };

        rawFiles.current.set(id, file);
        setFiles((prev) => {
          const updated = [...prev, uploadedFile];
          return updated;
        });

        // Auto-select first file
        setActiveFileId((prev) => prev ?? id);
      }
    },
    [files]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      e.target.value = '';
    },
    [processFiles]
  );

  const removeFile = useCallback(
    (id: string) => {
      rawFiles.current.delete(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setActiveFileId((prev) => {
        if (prev === id) {
          const remaining = files.filter((f) => f.id !== id);
          return remaining.length > 0 ? remaining[0].id : null;
        }
        return prev;
      });
    },
    [files]
  );

  const setActiveFile = useCallback((id: string) => {
    setActiveFileId(id);
  }, []);

  const activeGeometry = files.find((f) => f.id === activeFileId)?.geometry ?? null;
  const activeRawFile = activeFileId ? (rawFiles.current.get(activeFileId) ?? null) : null;

  return {
    files,
    isDragging,
    activeFileId,
    activeGeometry,
    activeRawFile,
    handleFileDrop,
    handleFileSelect,
    removeFile,
    setActiveFile,
    setDragging: setIsDragging,
    acceptedFormats: ACCEPTED_EXTENSIONS.join(','),
    maxFiles: MAX_FILES,
    canAddMore: files.length < MAX_FILES,
  };
}
