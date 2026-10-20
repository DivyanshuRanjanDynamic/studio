// ═══════════════════════════════════════════════════
// Quoting Domain Types
// ═══════════════════════════════════════════════════

/** Material definition with pricing data */
export interface Material {
  readonly id: string;
  readonly name: string;
  readonly alloy: string;
  readonly process: ProcessType;
  readonly densityGCm3: number;
  readonly pricePerKg: number; // INR
  readonly pricePerSheet: number; // INR
  readonly sheetWidthMm: number;
  readonly sheetHeightMm: number;
  readonly availableThicknesses: readonly number[]; // mm
  readonly kerfWidthMm: number;
  readonly availableFinishes: readonly FinishType[];
  readonly hardnessFactor: number;
  readonly isActive: boolean;
}

/** Manufacturing process types */
export type ProcessType =
  | 'laser_cut_fiber'
  | 'laser_cut_co2'
  | 'waterjet'
  | 'plasma'
  | 'cnc_machining_3axis'
  | 'cnc_machining_5axis'
  | 'sheet_metal_bending'
  | 'cnc_turning';

/** Available surface finishes */
export type FinishType =
  | 'none'
  | 'deburr'
  | 'anodize_clear'
  | 'anodize_color'
  | 'powder_coat'
  | 'zinc_plate'
  | 'chrome_plate'
  | 'nickel_plate'
  | 'black_oxide'
  | 'mirror_polish'
  | 'sand_blasting';

/** Finish metadata for pricing */
export interface FinishRate {
  readonly type: FinishType;
  readonly label: string;
  readonly costPerMm2: number;
  readonly minCost: number; // INR
}

/** Turnaround options */
export type TurnaroundType = 'economy_7d' | 'standard_3d' | 'express_2d' | 'rush_1d' | 'same_day';

export interface TurnaroundOption {
  readonly type: TurnaroundType;
  readonly label: string;
  readonly days: number;
  readonly multiplier: number;
  readonly description: string;
}

/** Parsed geometry from uploaded file */
export interface ParsedGeometry {
  readonly cutLengthMm: number;
  readonly areaMm2: number;
  readonly boundingBox: BoundingBox;
  readonly holeCount: number;
  readonly complexityScore: number; // 0–10
  readonly nodeCount: number;
  readonly minFeatureSizeMm: number;
  readonly minSlotWidthMm: number;
  readonly edgeToHoleDistanceMm: number;
  readonly hasOpenPaths: boolean;
}

export interface BoundingBox {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly aspectRatio: number;
}

/** DFM check results */
export type DFMSeverity = 'warning' | 'error';

export interface DFMIssue {
  readonly code: string;
  readonly severity: DFMSeverity;
  readonly message: string;
  readonly fixSuggestion: string;
  readonly blocking: boolean;
  readonly affectedFeature?: string;
}

/** Machine data for cost calculation */
export interface Machine {
  readonly id: string;
  readonly process: ProcessType;
  readonly maxSpeedMmS: number;
  readonly pierceTimeS: number;
  readonly hourlyRate: number; // INR
  readonly bedWidthMm: number;
  readonly bedHeightMm: number;
}

/** Quote pricing breakdown */
export interface QuoteBreakdown {
  readonly materialCost: number;
  readonly cutCost: number;
  readonly setupCost: number;
  readonly finishCost: number;
  readonly quantityMultiplier: number;
  readonly rushMultiplier: number;
  readonly marginPct: number;
}

/** Complete quote result */
export interface QuoteResult {
  readonly pricePerPart: number;
  readonly totalPrice: number;
  readonly leadTimeDays: number;
  readonly breakdown: QuoteBreakdown;
  readonly dfmIssues: readonly DFMIssue[];
  readonly hasBlockingIssues: boolean;
  readonly expiresAt: number; // Unix timestamp
  readonly quoteRef: string;
  readonly parameters: Omit<QuoteRequest, 'geometry'>;
  readonly geometry: ParsedGeometry;
}

/** Input for generating a quote */
export interface QuoteRequest {
  readonly materialId: string;
  readonly thicknessMm: number;
  readonly finishType: FinishType;
  readonly quantity: number;
  readonly turnaround: TurnaroundType;
  readonly geometry: ParsedGeometry;
}

/** Quantity tier for visual display */
export interface QuantityTier {
  readonly quantity: number;
  readonly multiplier: number;
  readonly pricePerPart: number;
  readonly totalPrice: number;
  readonly savingsPercent: number;
}

/** Any priced quote — laser (sheet) or CNC (analysis-backed) */
export type AnyQuoteResult = QuoteResult | CncQuoteResult;

/** Cart item for multi-part orders */
export interface QuoteCartItem {
  readonly id: string;
  readonly fileName: string;
  readonly filePreviewUrl?: string;
  readonly quote: AnyQuoteResult;
}

/** Uploaded file tracking */
export type FileStatus = 'uploading' | 'queued' | 'parsing' | 'dfm_check' | 'ready' | 'error';

export interface UploadedFile {
  readonly id: string;
  readonly fileName: string;
  readonly fileSizeBytes: number;
  readonly sha256Hash: string;
  readonly status: FileStatus;
  readonly geometry?: ParsedGeometry;
  readonly dfmIssues?: readonly DFMIssue[];
  readonly previewSvg?: string;
  readonly uploadProgress: number;
  readonly error?: string;
}

// ═══════════════════════════════════════════════════
// CNC Costing — mirrors POST /analyze-cnc on the CAD converter
// ═══════════════════════════════════════════════════

/** Material families with distinct cutting rates (keys of `machiningTime`) */
export type MachinabilityGroup =
  | 'aluminium'
  | 'brass'
  | 'copper'
  | 'mild_steel'
  | 'alloy_steel'
  | 'stainless'
  | 'plastic';

export type CncProcess = 'cnc_machining_3axis' | 'cnc_machining_5axis' | 'cnc_turning';

/** Process the customer picks on the instant-quote page */
export type QuoteProcessMode = 'laser' | 'cnc_milling' | 'cnc_turning';

export interface CncMachiningTime {
  readonly roughingMin: number;
  readonly finishingMin: number;
  readonly drillingMin: number;
  readonly secondaryMillingMin: number;
  readonly toolChangeMin: number;
  readonly overheadMin: number;
  readonly cycleMin: number;
}

export interface CncHoleGroup {
  readonly diameterMm: number;
  readonly depthMm: number;
  readonly through: boolean;
  readonly depthToDiameter: number;
  readonly count: number;
}

export interface CncStock {
  readonly shape: 'block' | 'round_bar';
  readonly dimensionsMm:
    | { readonly x: number; readonly y: number; readonly z: number }
    | { readonly diameter: number; readonly length: number };
  readonly volumeMm3: number;
  readonly removedVolumeMm3: number;
  readonly removalRatio: number;
}

/** Material-agnostic part analysis — price any material/quantity from one upload */
export interface CncAnalysis {
  readonly version: string;
  readonly units: 'mm';
  readonly part: {
    readonly volumeMm3: number;
    readonly surfaceAreaMm2: number;
    readonly boundingBox: { readonly x: number; readonly y: number; readonly z: number };
    readonly faceCount: number;
    readonly bodyCount: number;
  };
  readonly process: {
    readonly recommended: CncProcess;
    readonly secondaryMilling: boolean;
    readonly turnableFraction: number;
    readonly turningAxis: {
      readonly origin: { readonly x: number; readonly y: number; readonly z: number };
      readonly direction: { readonly x: number; readonly y: number; readonly z: number };
    } | null;
  };
  readonly stock: CncStock | null;
  readonly setups: {
    readonly count: number;
    readonly directions: readonly string[];
    readonly inaccessibleAreaMm2: number;
  };
  readonly features: {
    readonly holes: readonly CncHoleGroup[];
    readonly holeCount: number;
    readonly minInternalRadiusMm: number | null;
    readonly minWallThicknessMm: number | null;
    readonly sharpInternalCorners: number;
  };
  readonly toolCount: number;
  readonly machiningTime: Readonly<Record<MachinabilityGroup, CncMachiningTime>>;
  readonly setupTimeMin: number;
  readonly handlingTimePerPartMin: number;
  readonly programmingTimeMin: number;
  readonly dfm: readonly DFMIssue[];
  readonly analysisMs: number;
}

/** Per-material CNC stock pricing and cutting behaviour */
export interface CncMaterialData {
  readonly machinabilityGroup: MachinabilityGroup;
  readonly blockPricePerKg: number; // INR, plate/block stock
  readonly barPricePerKg: number; // INR, round bar stock
}

/** Shop economics — every rate a machine shop would want to override */
export interface CncShopRates {
  readonly machineRatePerHour: Readonly<Record<CncProcess, number>>; // INR, incl. operator
  readonly setupRatePerHour: number; // INR
  readonly programmingRatePerHour: number; // INR
  readonly materialWastePct: number; // saw kerf, offcuts, handling scrap
  readonly marginPct: number;
}

export interface CncQuoteBreakdown {
  readonly materialCost: number;
  readonly machiningCost: number;
  readonly setupCost: number; // amortised per part
  readonly programmingCost: number; // amortised per part
  readonly finishCost: number;
  /** Rigid tapping time + tap wear, per part (absent on quotes made before tapping existed) */
  readonly tappingCost?: number;
  readonly tappedHoles?: number;
  readonly cycleTimeMin: number;
  readonly quantityMultiplier: number;
  readonly rushMultiplier: number;
  readonly marginPct: number;
}

export interface CncQuoteRequest {
  readonly materialId: string;
  readonly finishType: FinishType;
  readonly quantity: number;
  readonly turnaround: TurnaroundType;
  /** Override the analyser's recommendation, e.g. force 5-axis */
  readonly process?: CncProcess;
  /** Threads to cut, matched server-side against the analysis's hole groups */
  readonly taps?: readonly CncTapRequest[];
}

/** One thread size and how many analysed holes get it (e.g. 4 × M6x1.0) */
export interface CncTapRequest {
  readonly tapId: string;
  readonly count: number;
}

export interface CncQuoteResult {
  readonly pricePerPart: number;
  readonly totalPrice: number;
  readonly leadTimeDays: number;
  readonly process: CncProcess;
  readonly breakdown: CncQuoteBreakdown;
  readonly dfmIssues: readonly DFMIssue[];
  readonly hasBlockingIssues: boolean;
  readonly expiresAt: number; // Unix timestamp
  readonly quoteRef: string;
  readonly parameters: CncQuoteRequest;
  readonly analysis: CncAnalysis;
}
