import { BoundingBox } from '@/types/viewer';

export interface DesignPatternResult {
  recommendedMode: '2D' | '3D';
  supportsBoth: boolean;
}

/**
 * CAD Intelligence Algorithm
 * Detects the design pattern based on geometric proportions.
 * 
 * Rules:
 * - FLAT: If any single dimension is < 15% of the other two, it's likely a profile/sheet part.
 * - 3D: If dimensions are relatively balanced.
 * - SUPPORTS_BOTH: Only if it's 'FLAT' (Sheet Metal/Laser Cutting).
 */
export function detectDesignPattern(boundingBox: BoundingBox): DesignPatternResult {
  const { x, y, z } = boundingBox;
  
  const dims = [x, y, z].sort((a, b) => a - b);
  const smallest = dims[0];
  const mid = dims[1];
  const largest = dims[2];

  const averageOther = (mid + largest) / 2;
  const isFlat = smallest < averageOther * 0.15;
  
  if (isFlat) {
    return {
      recommendedMode: '2D',
      supportsBoth: true
    };
  }

  return {
    recommendedMode: '3D',
    supportsBoth: false
  };
}
