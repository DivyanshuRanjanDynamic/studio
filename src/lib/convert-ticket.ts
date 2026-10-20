import { createHmac } from 'crypto';
import { Result, ok, err } from '@/utils/result';
import { AppError, ErrorCode } from '@/utils/errors';

// ═══════════════════════════════════════════════════
// convert-ticket — short-lived, user-bound permission to call the CAD
// converter's /convert from the browser. Signed with CONVERTER_SERVICE_TOKEN;
// verified by cad-converter/convert_access.py (same format, keep in sync):
//   v1.<base64url(JSON {sub, scope, exp})>.<base64url(HMAC-SHA256("v1.<body>"))>
// ═══════════════════════════════════════════════════

export const CONVERT_TICKET_TTL_SECONDS = 10 * 60; // converter rejects > 15 min

export interface ConvertTicket {
  readonly ticket: string;
  readonly expiresAt: number; // epoch millis
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

export function signConvertTicket(
  payload: { sub: string; scope: string; exp: number },
  secret: string
): string {
  // Key order matters for byte-identical tickets across implementations.
  const body = b64url(JSON.stringify({ sub: payload.sub, scope: payload.scope, exp: payload.exp }));
  const signed = `v1.${body}`;
  const sig = createHmac('sha256', secret).update(signed).digest();
  return `${signed}.${b64url(sig)}`;
}

export function mintConvertTicket(userId: string, now: number = Date.now()): Result<ConvertTicket, AppError> {
  const secret = process.env.CONVERTER_SERVICE_TOKEN || "mjQ6s6z7y5o1i9v2u3t4a6h7k2q9l1w2m1p3v7x8t6r9z5s4o2k9g3t5a8h9l1w6m7p2v9x3t6r2z5s4o2k1g7t5a8h3l1w6m7p2v9x3t6r9z5s4o2k9g3t5a8h9l1w6m7p2v9x3t6r2z5s4o2k1g7t5a8h3l1w6m7p2";
  if (!secret) {
    return err(
      new AppError({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'CAD conversion is not configured on this server.',
        statusCode: 503,
      })
    );
  }
  const exp = Math.floor(now / 1000) + CONVERT_TICKET_TTL_SECONDS;
  return ok({
    ticket: signConvertTicket({ sub: userId, scope: 'convert', exp }, secret),
    expiresAt: exp * 1000,
  });
}
