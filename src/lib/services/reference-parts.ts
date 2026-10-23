import type { CncAnalysis, SheetAnalysis } from '@/types/quoting';

// ═══════════════════════════════════════════════════
// Reference parts — real CAD converter measurements (23 Oct 2026) used to show
// live example prices on the service pages. Prices are computed from these with
// the same engines that price customer uploads, so they track every rate change.
// ═══════════════════════════════════════════════════

/** 200 × 100 × 2 mm flat plate with 4 × Ø4.2 mm holes */
export const REF_SHEET_PLATE: SheetAnalysis = {
  "version": "sheet-1",
  "units": "mm",
  "thicknessMm": 2.0,
  "volumeMm3": 39889.2,
  "surfaceAreaMm2": 41194.7,
  "flatAreaMm2": 19944.6,
  "cutLengthMm": 652.8,
  "pierces": 5,
  "holes": [
    {
      "diameterMm": 4.2,
      "count": 4
    }
  ],
  "bends": [],
  "boundingBox": {
    "x": 200.0,
    "y": 100.0,
    "z": 2.0
  },
  "isFlat": true,
  "bodyCount": 1,
  "analysisMs": 15
};

/** 2 mm L-bracket: 100 mm base + 40 mm flange × 50 mm wide, one 90° bend, 2 × Ø4.2 mm holes */
export const REF_SHEET_BRACKET: SheetAnalysis = {
  "version": "sheet-1",
  "units": "mm",
  "thicknessMm": 2.0,
  "volumeMm3": 13620.1,
  "surfaceAreaMm2": 14419.9,
  "flatAreaMm2": 6810.1,
  "cutLengthMm": 399.9,
  "pierces": 3,
  "holes": [
    {
      "diameterMm": 4.2,
      "count": 2
    }
  ],
  "bends": [
    {
      "angleDeg": 90.0,
      "radiusMm": 1.9,
      "lengthMm": 50.0
    }
  ],
  "boundingBox": {
    "x": 100.0,
    "y": 50.0,
    "z": 40.0
  },
  "isFlat": false,
  "bodyCount": 1,
  "analysisMs": 15
};

/** 80 × 50 × 20 mm milled block: 50 × 30 × 10 mm pocket, 4 × Ø5 mm through holes */
export const REF_CNC_BLOCK = {
  "version": "cnc-1",
  "units": "mm",
  "part": {
    "volumeMm3": 63566.55,
    "surfaceAreaMm2": 15830.88,
    "boundingBox": {
      "x": 80.0,
      "y": 50.0,
      "z": 20.0
    },
    "faceCount": 19,
    "bodyCount": 1
  },
  "process": {
    "recommended": "cnc_machining_3axis",
    "secondaryMilling": false,
    "turnableFraction": 0.0,
    "turningAxis": null
  },
  "stock": {
    "shape": "block",
    "dimensionsMm": {
      "x": 85,
      "y": 55,
      "z": 25.0
    },
    "volumeMm3": 116875.0,
    "removedVolumeMm3": 53308.5,
    "removalRatio": 0.456
  },
  "setups": {
    "count": 2,
    "directions": [
      "+Z",
      "-Z"
    ],
    "inaccessibleAreaMm2": 0
  },
  "features": {
    "holes": [
      {
        "diameterMm": 5.0,
        "depthMm": 20.0,
        "through": true,
        "depthToDiameter": 4.0,
        "count": 4
      }
    ],
    "holeCount": 4,
    "minInternalRadiusMm": 4.0,
    "minWallThicknessMm": 4.5,
    "sharpInternalCorners": 0
  },
  "toolCount": 4,
  "machiningTime": {
    "aluminium": {
      "roughingMin": 1.29,
      "finishingMin": 9.72,
      "drillingMin": 0.69,
      "secondaryMillingMin": 0.0,
      "toolChangeMin": 1.2,
      "overheadMin": 1.4,
      "cycleMin": 14.3
    },
    "brass": {
      "roughingMin": 1.72,
      "finishingMin": 12.15,
      "drillingMin": 0.76,
      "secondaryMillingMin": 0.0,
      "toolChangeMin": 1.2,
      "overheadMin": 1.76,
      "cycleMin": 17.58
    },
    "copper": {
      "roughingMin": 2.59,
      "finishingMin": 14.57,
      "drillingMin": 0.87,
      "secondaryMillingMin": 0.0,
      "toolChangeMin": 1.2,
      "overheadMin": 2.16,
      "cycleMin": 21.39
    },
    "mild_steel": {
      "roughingMin": 3.45,
      "finishingMin": 18.22,
      "drillingMin": 1.24,
      "secondaryMillingMin": 0.0,
      "toolChangeMin": 1.2,
      "overheadMin": 2.75,
      "cycleMin": 26.85
    },
    "alloy_steel": {
      "roughingMin": 5.17,
      "finishingMin": 24.29,
      "drillingMin": 1.69,
      "secondaryMillingMin": 0.0,
      "toolChangeMin": 1.2,
      "overheadMin": 3.74,
      "cycleMin": 36.1
    },
    "stainless": {
      "roughingMin": 6.47,
      "finishingMin": 29.15,
      "drillingMin": 2.15,
      "secondaryMillingMin": 0.0,
      "toolChangeMin": 1.2,
      "overheadMin": 4.53,
      "cycleMin": 43.5
    },
    "plastic": {
      "roughingMin": 0.86,
      "finishingMin": 7.29,
      "drillingMin": 0.59,
      "secondaryMillingMin": 0.0,
      "toolChangeMin": 1.2,
      "overheadMin": 1.05,
      "cycleMin": 10.99
    }
  },
  "setupTimeMin": 52.0,
  "handlingTimePerPartMin": 3.0,
  "programmingTimeMin": 27.9,
  "dfm": [],
  "analysisMs": 58
} as unknown as CncAnalysis;
