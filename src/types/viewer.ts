/**
 * CAD Viewer Types
 * 
 * Defines the contract between the frontend and the 
 * CAD conversion microservices (Python/CadQuery).
 */

export interface BoundingBox {
  x: number;
  y: number;
  z: number;
}

export interface HoleFeature {
  center: { x: number; y: number; z: number };
  radius: number;
  depth: number;
  normal: { x: number; y: number; z: number };
}

export interface BendFeature {
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  angle: number;
  direction: 'UP' | 'DOWN';
  radius: number;
}

/** 2D bend line projected onto flat pattern */
export interface FlatPatternBendLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
  direction: 'UP' | 'DOWN';
  radius: number;
}

/** SVG flat pattern with projected bend lines */
export interface FlatPattern {
  /** Raw SVG markup string */
  svg: string;
  /** SVG viewBox dimensions */
  viewBox: {
    minX: number;
    minY: number;
    width: number;
    height: number;
  };
  /** Structured 2D bend line data */
  bendLines: FlatPatternBendLine[];
}

/** Response from /analyze-bends endpoint */
export interface BendAnalysisResult {
  bends: BendFeature[];
  detectedThickness: number | null;
  flatPattern: FlatPattern | null;
  boundingBox: BoundingBox;
}

export interface ConversionResult {
  /** Base64-encoded binary STL data */
  stl: string;
  /** Number of facets in the generated mesh */
  triangleCount: number;
  /** Dimensions of the part in millimeters */
  boundingBox: BoundingBox;
  /** List of detected circular holes */
  holes?: HoleFeature[];
  /** List of detected sheet metal bends */
  bends?: BendFeature[];
  /** Detected sheet metal thickness in mm */
  detectedThickness?: number;
  /** SVG flat pattern with projected bend lines */
  flatPattern?: FlatPattern;
}
