// ═══════════════════════════════════════════════════
// Structured Logger — NEVER use console.log
// Every log must include: event, userId (if available), relevant IDs, timing
// ═══════════════════════════════════════════════════

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogPayload {
  event: string;
  [key: string]: unknown;
}

const REDACTED_FIELDS = new Set([
  'password',
  'apiKey',
  'secret',
  'token',
  'cardNumber',
  'cvv',
  'razorpaySignature',
  'razorpay_signature',
]);

function redact(payload: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (REDACTED_FIELDS.has(key)) {
      cleaned[key] = '[REDACTED]';
    } else if (value instanceof Error) {
      cleaned[key] = {
        message: value.message,
        name: value.name,
        stack: value.stack,
        ...(value as any),
      };
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      cleaned[key] = redact(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function formatLog(level: LogLevel, payload: LogPayload): string {
  const timestamp = new Date().toISOString();
  const redacted = redact(payload);
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    return JSON.stringify({ timestamp, level, ...redacted });
  }

  const color = {
    debug: '\x1b[90m',
    info: '\x1b[36m',
    warn: '\x1b[33m',
    error: '\x1b[31m',
    fatal: '\x1b[35m',
  }[level];
  const reset = '\x1b[0m';

  return `${color}[${level.toUpperCase()}]${reset} ${timestamp} ${redacted.event} ${JSON.stringify(
    Object.fromEntries(Object.entries(redacted).filter(([k]) => k !== 'event')),
    null,
    2
  )}`;
}

/**
 * In a production browser only errors reach the console: visitors' DevTools
 * shouldn't show our debug/info chatter (or ids and URLs inside it). Server
 * logs are unaffected — they feed Cloud Logging.
 */
function silencedInBrowser(level: LogLevel): boolean {
  return (
    typeof window !== 'undefined' &&
    process.env.NODE_ENV === 'production' &&
    level !== 'error' &&
    level !== 'fatal'
  );
}

function createLogFn(level: LogLevel): (payload: LogPayload) => void {
  return (payload: LogPayload): void => {
    if (silencedInBrowser(level)) return;
    const formatted = formatLog(level, payload);

    switch (level) {
      case 'debug':
        // eslint-disable-next-line no-console
        console.debug(formatted);
        break;
      case 'info':
        // eslint-disable-next-line no-console
        console.info(formatted);
        break;
      case 'warn':
        // eslint-disable-next-line no-console
        console.warn(formatted);
        break;
      case 'error':
      case 'fatal':
        // eslint-disable-next-line no-console
        console.error(formatted);
        break;
    }
  };
}

export const logger = {
  debug: createLogFn('debug'),
  info: createLogFn('info'),
  warn: createLogFn('warn'),
  error: createLogFn('error'),
  fatal: createLogFn('fatal'),
} as const;
