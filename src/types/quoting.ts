// ═══════════════════════════════════════════════════
// Quoting Domain Types
// ═══════════════════════════════════════════════════

/** Material definition with pricing data */
/** A machining material. Stock prices live in lib/quoting/material-prices.ts */
export interface Material {
  readonly id: string;
  readonly name: string;
  readonly alloy: string;
  readonly densityGCm3: number;
  readonly availableFinishes: readonly FinishType[];
  readonly isActive: boolean;
}

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

/** Legacy laser quote breakdown (quotes saved before laser pricing read the real file) */
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

/**
 * Any saved quote. Laser quotes are SheetQuoteResult; QuoteResult is the legacy
 * laser format, kept so quotes saved before the switch still open from share links.
 */
export type AnyQuoteResult = QuoteResult | CncQuoteResult | SheetQuoteResult;

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
  /** Admin calibration factor applied to the final price (absent = 1.00) */
  readonly calibrationMultiplier?: number;
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

// ═══════════════════════════════════════════════════
// Sheet metal — laser cutting + press-brake bending + tapping
// Mirrors POST /internal/analyze-sheet on the CAD converter
// ═══════════════════════════════════════════════════

/** Through holes in the sheet, grouped by diameter (depth is the sheet thickness) */
export interface SheetHoleGroup {
  readonly diameterMm: number;
  readonly count: number;
}

export interface SheetBend {
  readonly angleDeg: number;
  readonly radiusMm: number;
  /** Length of the bend line — what the press brake has to form */
  readonly lengthMm: number;
}

/** Material-agnostic sheet analysis: one upload prices every material, thickness and quantity */
export interface SheetAnalysis {
  readonly version: string;
  readonly units: 'mm';
  /** Constant wall thickness detected in the model */
  readonly thicknessMm: number;
  readonly volumeMm3: number;
  readonly surfaceAreaMm2: number;
  /** Developed (unfolded) blank area = volume / thickness */
  readonly flatAreaMm2: number;
  /** Laser path = edge-wall area / thickness (outer profile + every cut-out) */
  readonly cutLengthMm: number;
  /** Laser starts: 1 for the outer profile + 1 per internal cut-out */
  readonly pierces: number;
  readonly holes: readonly SheetHoleGroup[];
  readonly bends: readonly SheetBend[];
  readonly boundingBox: { readonly x: number; readonly y: number; readonly z: number };
  /** No bends: the bounding box is the exact blank size */
  readonly isFlat: boolean;
  /** Read from a 2D profile (DXF): thickness is the customer's choice, not the model's */
  readonly profileOnly?: boolean;
  readonly bodyCount: number;
  readonly analysisMs: number;
}

/** Laser-cutting behaviour family (speed table + machine) */
export type SheetCutFamily = 'mild_steel' | 'stainless' | 'aluminium' | 'acrylic' | 'mdf' | 'plywood' | 'balsa';

export interface SheetQuoteRequest {
  /** Wizard material id, e.g. 'ss-304' */
  readonly materialId: string;
  readonly thicknessMm: number;
  readonly finishType: FinishType;
  readonly quantity: number;
  readonly turnaround: TurnaroundType;
  readonly taps?: readonly CncTapRequest[];
  /** Customer ticked Bending — only changes the note; bends in the model are always priced */
  readonly bendingSelected?: boolean;
}

export interface SheetQuoteBreakdown {
  readonly materialCost: number;
  readonly cutCost: number;
  /** CAM nesting + sheet loading, amortised per part */
  readonly laserSetupCost: number;
  readonly bendingCost: number;
  readonly tappingCost: number;
  readonly tappedHoles: number;
  readonly finishCost: number;
  readonly cutTimeMin: number;
  readonly bendCount: number;
  readonly bendTimeMin: number;
  readonly sheetUtilisation: number;
  readonly quantityMultiplier: number;
  readonly rushMultiplier: number;
  readonly marginPct: number;
  /** Admin calibration factor applied to the final price (absent = 1.00) */
  readonly calibrationMultiplier?: number;
}

export interface SheetQuoteResult {
  readonly kind: 'sheet';
  readonly pricePerPart: number;
  readonly totalPrice: number;
  readonly leadTimeDays: number;
  readonly breakdown: SheetQuoteBreakdown;
  readonly dfmIssues: readonly DFMIssue[];
  readonly hasBlockingIssues: boolean;
  readonly expiresAt: number;
  readonly quoteRef: string;
  readonly parameters: SheetQuoteRequest;
  readonly analysis: SheetAnalysis;
}

// ═══════════════════════════════════════════════════
// FDM 3D printing — mirrors POST /internal/analyze-print
// ═══════════════════════════════════════════════════

export type PrintUpAxis = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';

/** The part laid on the bed with this axis pointing up */
export interface PrintOrientation {
  readonly up: PrintUpAxis;
  readonly sizeMm: { readonly x: number; readonly y: number; readonly z: number };
  /** Volume between overhangs (> 45°) and the bed, before support density */
  readonly supportVolumeMm3: number;
}

export interface PrintAnalysis {
  readonly version: string;
  readonly units: 'mm';
  readonly volumeMm3: number;
  readonly surfaceAreaMm2: number;
  readonly triangleCount: number;
  readonly orientations: readonly PrintOrientation[];
  readonly analysisMs: number;
}

export interface PrintQuoteRequest {
  /** Wizard material id, e.g. 'petg' */
  readonly materialId: string;
  readonly finishType: FinishType;
  readonly quantity: number;
  readonly turnaround: TurnaroundType;
}

export interface PrintQuoteBreakdown {
  readonly materialCost: number;
  readonly machineCost: number;
  readonly labourCost: number;
  /** Slicing + plate prep, amortised per part */
  readonly setupCost: number;
  readonly finishCost: number;
  readonly massG: number;
  readonly printTimeMin: number;
  readonly supportVolumeMm3: number;
  readonly orientation: PrintUpAxis;
  readonly quantityMultiplier: number;
  readonly rushMultiplier: number;
  readonly marginPct: number;
  /** Admin calibration factor applied to the final price (absent = 1.00) */
  readonly calibrationMultiplier?: number;
}

/** A stored sheet/print analysis the wizard prices from (POST /api/v1/quote/part/analyze) */
export type PartAnalysisHandle =
  | { readonly kind: 'sheet'; readonly analysisId: string; readonly analysis: SheetAnalysis }
  | { readonly kind: 'print'; readonly analysisId: string; readonly analysis: PrintAnalysis };

export interface PrintQuoteResult {
  readonly kind: 'print';
  readonly pricePerPart: number;
  readonly totalPrice: number;
  readonly leadTimeDays: number;
  readonly breakdown: PrintQuoteBreakdown;
  readonly dfmIssues: readonly DFMIssue[];
  readonly hasBlockingIssues: boolean;
  readonly expiresAt: number;
  readonly quoteRef: string;
  readonly parameters: PrintQuoteRequest;
  readonly analysis: PrintAnalysis;
}
