'use client';

// ═══════════════════════════════════════════════════
// use-file-upload — Multi-file upload with deduplication
// Generates SHA-256 hash, tracks progress per file.
// ═══════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react';
import type { UploadedFile, FileStatus } from '@/types/quoting';

const MAX_FILES = 10;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
// Laser prices STEP or DXF, CNC prices STEP; the converter measures the file itself.
const ACCEPTED_EXTENSIONS = ['.dxf', '.step', '.stp'];

export interface UseFileUploadReturn {
  files: readonly UploadedFile[];
  isDragging: boolean;
  activeFileId: string | null;
  /** Original File for the active upload — the converter analyses it server-side */
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
        const uploadedFile: UploadedFile = {
          id,
          fileName: file.name,
          fileSizeBytes: file.size,
          sha256Hash: hash,
          status: 'ready' as FileStatus,
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

  const activeRawFile = activeFileId ? (rawFiles.current.get(activeFileId) ?? null) : null;

  return {
    files,
    isDragging,
    activeFileId,
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
