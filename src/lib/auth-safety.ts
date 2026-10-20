const IP_PATTERN = /^[0-9a-fA-F:.]{2,45}$/;

/**
 * The caller's IP for rate limiting — only from values our own infrastructure wrote.
 *
 * X-Forwarded-For is `<anything the client sent>, <client-ip>, <load-balancer-ip>`
 * behind Google's load balancer (Firebase App Hosting), so the leftmost entries are
 * attacker-controlled and the client is TRUSTED_PROXY_HOPS (default 2) from the right.
 * Set TRUSTED_CLIENT_IP_HEADER (e.g. `x-fah-client-ip`) only once you've confirmed the
 * platform overwrites that header. Returns 'unknown' rather than guessing.
 */
export function getClientIdentifier(headers: Headers): string {
  const trustedHeader = process.env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase();
  if (trustedHeader) {
    const direct = headers.get(trustedHeader)?.trim();
    if (direct && IP_PATTERN.test(direct)) return direct;
  }

  const hops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? '2', 10);
  const chain = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (Number.isInteger(hops) && hops > 0 && chain.length >= hops) {
    const candidate = chain[chain.length - hops];
    if (IP_PATTERN.test(candidate)) return candidate;
  }
  return 'unknown';
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 254) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(normalized) ? normalized : null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function getSafeRedirectPath(
  redirectPath: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!redirectPath || typeof redirectPath !== 'string') return fallback;

  const trimmed = redirectPath.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed, 'http://localhost');
    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    const lowered = parsed.pathname.toLowerCase();

    if (lowered.startsWith('/api') || lowered.startsWith('/_next') || lowered === '/login') {
      return fallback;
    }

    return normalized;
  } catch {
    return fallback;
  }
}
