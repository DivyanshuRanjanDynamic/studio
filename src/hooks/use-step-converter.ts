import { useState, useCallback } from 'react';
import { convertStepFile, stlBase64ToBuffer } from '@/services/stepConverter.service';
import { ConversionResult } from '@/types/viewer';

export interface UseStepConverterReturn {
  isConverting: boolean;
  error: string | null;
  result: ConversionResult | null;
  stlBuffer: ArrayBuffer | null;
  convertFile: (file: File) => Promise<void>;
  reset: () => void;
}

/**
 * Hook to manage the lifecycle of a STEP-to-STL conversion.
 */
export function useStepConverter(): UseStepConverterReturn {
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [stlBuffer, setStlBuffer] = useState<ArrayBuffer | null>(null);

  const convertFile = useCallback(async (file: File) => {
    setIsConverting(true);
    setError(null);
    setResult(null);
    setStlBuffer(null);

    try {
      const conversionResult = await convertStepFile(file);
      setResult(conversionResult);
      
      // Convert base64 STL to ArrayBuffer for Three.js
      const buffer = stlBase64ToBuffer(conversionResult.stl);
      setStlBuffer(buffer);
    } catch (err) {
      console.error('CAD Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Unknown conversion error');
    } finally {
      setIsConverting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsConverting(false);
    setError(null);
    setResult(null);
    setStlBuffer(null);
  }, []);

  return {
    isConverting,
    error,
    result,
    stlBuffer,
    convertFile,
    reset,
  };
}
