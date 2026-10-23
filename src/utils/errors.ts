// ═══════════════════════════════════════════════════
// AppError — Typed error hierarchy for MechHub
// Every error must have: code, message, statusCode, context
// ═══════════════════════════════════════════════════

export enum ErrorCode {
  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_INPUT = 'INVALID_INPUT',

  // Quoting domain
  INVALID_MATERIAL = 'INVALID_MATERIAL',
  INVALID_THICKNESS = 'INVALID_THICKNESS',
  INVALID_FINISH = 'INVALID_FINISH',
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  INVALID_TURNAROUND = 'INVALID_TURNAROUND',

  // DFM
  DFM_MIN_FEATURE = 'DFM_MIN_FEATURE',
  DFM_MIN_SLOT_WIDTH = 'DFM_MIN_SLOT_WIDTH',
  DFM_EDGE_TO_HOLE = 'DFM_EDGE_TO_HOLE',
  DFM_PART_TOO_LARGE = 'DFM_PART_TOO_LARGE',
  DFM_TINY_FEATURE = 'DFM_TINY_FEATURE',
  DFM_OPEN_GEOMETRY = 'DFM_OPEN_GEOMETRY',

  // File processing
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  PARSE_FAILED = 'PARSE_FAILED',
  DUPLICATE_FILE = 'DUPLICATE_FILE',
  /** Valid solid, but not a constant-thickness sheet — sheet pricing can't apply */
  NOT_SHEET_METAL = 'NOT_SHEET_METAL',

  // Auth
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',

  // Payment
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_VERIFICATION_FAILED = 'PAYMENT_VERIFICATION_FAILED',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',

  // Infrastructure
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NOT_FOUND = 'NOT_FOUND',
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(params: {
    code: ErrorCode;
    message: string;
    statusCode?: number;
    context?: Record<string, unknown>;
    isOperational?: boolean;
    cause?: Error;
  }) {
    super(params.message, { cause: params.cause });
    this.name = 'AppError';
    this.code = params.code;
    this.statusCode = params.statusCode ?? 500;
    this.context = params.context ?? {};
    this.isOperational = params.isOperational ?? true;
  }

  public toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      ...(Object.keys(this.context).length > 0 ? { context: this.context } : {}),
    };
  }
}

/** Factory for common errors */
export function validationError(message: string, context?: Record<string, unknown>): AppError {
  return new AppError({
    code: ErrorCode.VALIDATION_FAILED,
    message,
    statusCode: 400,
    context: context ?? {},
  });
}

export function notFoundError(resource: string, id: string): AppError {
  return new AppError({
    code: ErrorCode.NOT_FOUND,
    message: `${resource} not found: ${id}`,
    statusCode: 404,
    context: { resource, id },
  });
}

export function internalError(message: string, cause?: Error): AppError {
  return new AppError({
    code: ErrorCode.INTERNAL_ERROR,
    message,
    statusCode: 500,
    isOperational: false,
    cause,
  });
}
