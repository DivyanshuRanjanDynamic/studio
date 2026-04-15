/**
 * Manufacturing & Industrial Configuration
 * Shared across Customer & Admin panels
 */

export interface TapStandard {
  id: string;
  name: string;
  drillSize: number;
  pitch?: number;
  isInch?: boolean;
}

export const METRIC_TAPS: TapStandard[] = [
  { id: 'M2x0.4', name: 'M2 × 0.4', drillSize: 1.6, pitch: 0.4 },
  { id: 'M2.5x0.45', name: 'M2.5 × 0.45', drillSize: 2.1, pitch: 0.45 },
  { id: 'M3x0.5', name: 'M3 × 0.5', drillSize: 2.5, pitch: 0.5 },
  { id: 'M4x0.7', name: 'M4 × 0.7', drillSize: 3.3, pitch: 0.7 },
  { id: 'M5x0.8', name: 'M5 × 0.8', drillSize: 4.2, pitch: 0.8 },
  { id: 'M6x1.0', name: 'M6 × 1.0', drillSize: 5.0, pitch: 1.0 },
  { id: 'M8x1.25', name: 'M8 × 1.25', drillSize: 6.8, pitch: 1.25 },
  { id: 'M10x1.5', name: 'M10 × 1.5', drillSize: 8.5, pitch: 1.5 },
  { id: 'M12x1.75', name: 'M12 × 1.75', drillSize: 10.3, pitch: 1.75 },
];

export const IMPERIAL_TAPS: TapStandard[] = [
  { id: '2-56', name: '#2-56 UNC', drillSize: 1.85, isInch: true },
  { id: '4-40', name: '#4-40 UNC', drillSize: 2.30, isInch: true },
  { id: '6-32', name: '#6-32 UNC', drillSize: 2.85, isInch: true },
  { id: '8-32', name: '#8-32 UNC', drillSize: 3.50, isInch: true },
  { id: '10-24', name: '#10-24 UNC', drillSize: 3.90, isInch: true },
  { id: '10-32', name: '#10-32 UNF', drillSize: 4.10, isInch: true },
  { id: '1/4-20', name: '1/4"-20 UNC', drillSize: 5.10, isInch: true },
  { id: '5/16-18', name: '5/16"-18 UNC', drillSize: 6.60, isInch: true },
  { id: '3/8-16', name: '3/8"-16 UNC', drillSize: 8.00, isInch: true },
  { id: '1/2-13', name: '1/2"-13 UNC', drillSize: 10.80, isInch: true },
];

export const ALL_TAPS = [...METRIC_TAPS, ...IMPERIAL_TAPS];

export const getTapName = (id: string) => ALL_TAPS.find(t => t.id === id)?.name || id;
