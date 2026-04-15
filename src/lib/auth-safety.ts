export function getClientIdentifier(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  const realIp = headers.get('x-real-ip');
  const candidate = (forwardedFor?.split(',')[0] || realIp || 'anonymous').trim();
  return candidate.slice(0, 128) || 'anonymous';
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
