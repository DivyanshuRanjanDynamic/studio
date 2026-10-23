// ═══════════════════════════════════════════════════
// Quoting Validation — Zod schemas
// Every API input validated before touching business logic
// ═══════════════════════════════════════════════════

import { z } from 'zod';

export const finishTypeSchema = z.enum([
  'none',
  'deburr',
  'anodize_clear',
  'anodize_color',
  'powder_coat',
  'zinc_plate',
  'chrome_plate',
  'nickel_plate',
  'black_oxide',
  'mirror_polish',
  'sand_blasting',
]);

export const turnaroundSchema = z.enum([
  'economy_7d',
  'standard_3d',
  'express_2d',
  'rush_1d',
  'same_day',
]);

export const boundingBoxSchema = z.object({
  widthMm: z.number().positive().max(3000),
  heightMm: z.number().positive().max(3000),
  aspectRatio: z.number().positive(),
});

export const parsedGeometrySchema = z.object({
  cutLengthMm: z.number().nonnegative(),
  areaMm2: z.number().positive(),
  boundingBox: boundingBoxSchema,
  holeCount: z.number().int().nonnegative(),
  complexityScore: z.number().min(0).max(10),
  nodeCount: z.number().int().nonnegative(),
  minFeatureSizeMm: z.number().nonnegative(),
  minSlotWidthMm: z.number().nonnegative(),
  edgeToHoleDistanceMm: z.number().nonnegative(),
  hasOpenPaths: z.boolean(),
});

export const quoteRequestSchema = z.object({
  materialId: z.string().min(1),
  thicknessMm: z.number().positive().max(100),
  finishType: finishTypeSchema,
  quantity: z.number().int().min(1).max(10000),
  turnaround: turnaroundSchema,
  geometry: parsedGeometrySchema,
});

export const materialSelectionSchema = z.object({
  materialId: z.string().min(1),
  thicknessMm: z.number().positive(),
  finishType: finishTypeSchema,
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type MaterialSelectionInput = z.infer<typeof materialSelectionSchema>;

// ═══ CNC — mirrors CncAnalysis from POST /analyze-cnc ═══

const nonNeg = z.number().finite().nonnegative();
const vec3Schema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

export const cncProcessSchema = z.enum([
  'cnc_machining_3axis',
  'cnc_machining_5axis',
  'cnc_turning',
]);

const cncMachiningTimeSchema = z.object({
  roughingMin: nonNeg,
  finishingMin: nonNeg,
  drillingMin: nonNeg,
  secondaryMillingMin: nonNeg,
  toolChangeMin: nonNeg,
  overheadMin: nonNeg,
  cycleMin: nonNeg,
});

const dfmIssueSchema = z.object({
  code: z.string().min(1),
  severity: z.enum(['warning', 'error']),
  message: z.string(),
  fixSuggestion: z.string(),
  blocking: z.boolean(),
  affectedFeature: z.string().optional(),
});

export const cncAnalysisSchema = z.object({
  version: z.string().min(1),
  units: z.literal('mm'),
  part: z.object({
    volumeMm3: nonNeg,
    surfaceAreaMm2: nonNeg,
    boundingBox: vec3Schema,
    faceCount: z.number().int().nonnegative(),
    bodyCount: z.number().int().nonnegative(),
  }),
  process: z.object({
    recommended: cncProcessSchema,
    secondaryMilling: z.boolean(),
    turnableFraction: z.number().min(0).max(1),
    turningAxis: z.object({ origin: vec3Schema, direction: vec3Schema }).nullable(),
  }),
  stock: z
    .object({
      shape: z.enum(['block', 'round_bar']),
      dimensionsMm: z.union([
        z.object({ x: nonNeg, y: nonNeg, z: nonNeg }),
        z.object({ diameter: nonNeg, length: nonNeg }),
      ]),
      volumeMm3: nonNeg,
      removedVolumeMm3: nonNeg,
      removalRatio: z.number().min(0).max(1),
    })
    .nullable(),
  setups: z.object({
    count: z.number().int().nonnegative(),
    directions: z.array(z.string()),
    inaccessibleAreaMm2: nonNeg,
  }),
  features: z.object({
    holes: z.array(
      z.object({
        diameterMm: nonNeg,
        depthMm: nonNeg,
        through: z.boolean(),
        depthToDiameter: nonNeg,
        count: z.number().int().nonnegative(),
      })
    ),
    holeCount: z.number().int().nonnegative(),
    minInternalRadiusMm: nonNeg.nullable(),
    minWallThicknessMm: nonNeg.nullable(),
    sharpInternalCorners: z.number().int().nonnegative(),
  }),
  toolCount: z.number().int().nonnegative(),
  machiningTime: z.object({
    aluminium: cncMachiningTimeSchema,
    brass: cncMachiningTimeSchema,
    copper: cncMachiningTimeSchema,
    mild_steel: cncMachiningTimeSchema,
    alloy_steel: cncMachiningTimeSchema,
    stainless: cncMachiningTimeSchema,
    plastic: cncMachiningTimeSchema,
  }),
  setupTimeMin: nonNeg,
  handlingTimePerPartMin: nonNeg,
  programmingTimeMin: nonNeg,
  dfm: z.array(dfmIssueSchema),
  analysisMs: nonNeg,
});

export const cncQuoteRequestSchema = z.object({
  materialId: z.string().min(1),
  finishType: finishTypeSchema,
  quantity: z.number().int().min(1).max(10000),
  turnaround: turnaroundSchema,
  process: cncProcessSchema.optional(),
  /** Threads to cut; matched against the stored analysis server-side */
  taps: z
    .array(
      z.object({
        tapId: z.string().min(1).max(20),
        count: z.number().int().min(1).max(500),
      })
    )
    .max(20)
    .optional(),
});

/** POST /api/v1/quote/cnc — a server-stored analysis + the customer's options */
export const cncQuoteCreateSchema = z.object({
  analysisId: z.string().min(1).max(64),
  request: cncQuoteRequestSchema,
});

export type CncQuoteCreateInput = z.infer<typeof cncQuoteCreateSchema>;

// ═══ Sheet metal — mirrors SheetAnalysis from POST /internal/analyze-sheet ═══

const tapRequestsSchema = z
  .array(z.object({ tapId: z.string().min(1).max(20), count: z.number().int().min(1).max(500) }))
  .max(20)
  .optional();

export const sheetAnalysisSchema = z.object({
  version: z.string().min(1),
  units: z.literal('mm'),
  thicknessMm: z.number().finite().positive().max(50),
  volumeMm3: z.number().finite().positive(),
  surfaceAreaMm2: z.number().finite().positive(),
  flatAreaMm2: z.number().finite().positive(),
  cutLengthMm: nonNeg,
  pierces: z.number().int().min(1),
  holes: z.array(z.object({ diameterMm: z.number().finite().positive(), count: z.number().int().min(1) })),
  bends: z.array(
    z.object({ angleDeg: nonNeg, radiusMm: nonNeg, lengthMm: nonNeg })
  ),
  boundingBox: z.object({ x: nonNeg, y: nonNeg, z: nonNeg }),
  isFlat: z.boolean(),
  bodyCount: z.number().int().min(1),
  analysisMs: nonNeg,
  profileOnly: z.boolean().optional(),
});

export const sheetQuoteRequestSchema = z.object({
  materialId: z.string().min(1).max(40),
  thicknessMm: z.number().finite().positive().max(50),
  finishType: finishTypeSchema,
  quantity: z.number().int().min(1).max(10000),
  turnaround: turnaroundSchema,
  taps: tapRequestsSchema,
  bendingSelected: z.boolean().optional(),
});

export const sheetQuoteCreateSchema = z.object({
  analysisId: z.string().min(1).max(64),
  request: sheetQuoteRequestSchema,
});

// ═══ FDM printing — mirrors PrintAnalysis from POST /internal/analyze-print ═══

const printUpAxisSchema = z.enum(['+x', '-x', '+y', '-y', '+z', '-z']);

export const printAnalysisSchema = z.object({
  version: z.string().min(1),
  units: z.literal('mm'),
  volumeMm3: z.number().finite().positive(),
  surfaceAreaMm2: z.number().finite().positive(),
  triangleCount: z.number().int().min(4),
  orientations: z
    .array(
      z.object({
        up: printUpAxisSchema,
        sizeMm: z.object({ x: nonNeg, y: nonNeg, z: nonNeg }),
        supportVolumeMm3: nonNeg,
      })
    )
    .min(1)
    .max(6),
  analysisMs: nonNeg,
});

export const printQuoteRequestSchema = z.object({
  materialId: z.string().min(1).max(40),
  finishType: finishTypeSchema,
  quantity: z.number().int().min(1).max(10000),
  turnaround: turnaroundSchema,
});

/** POST /api/v1/quote/part/analyze — a wizard upload analysed for sheet or print pricing */
export const partAnalyzeSchema = z.object({
  fileKey: z.string().min(1).max(512),
  kind: z.enum(['sheet', 'print']),
});

/** POST /api/v1/quote/cnc/upload-intent */
export const cncUploadIntentSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().int().positive(),
});

/** POST /api/v1/quote/cnc/analyze — a key returned by the upload intent */
export const cncAnalyzeSchema = z.object({
  fileKey: z.string().min(1).max(512),
});
