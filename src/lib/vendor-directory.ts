// ═══════════════════════════════════════════════════
// vendor-directory — the public face of a vendor account
//
// users/{uid} also holds a vendor's email, phone, workshop address, GST number and
// revenue, and Firestore rules can't hide fields, so browsers never read vendor
// user docs. The directory route returns these cards instead.
// ═══════════════════════════════════════════════════

export interface VendorCard {
  readonly id: string;
  readonly role: string;
  readonly fullName: string | null;
  readonly teamName: string | null;
  readonly imageUrl: string | null;
  readonly isVerified: boolean;
  readonly rating: number | null;
  readonly location: string | null;
  readonly experienceYears: number | null;
  readonly specializations: string[];
  readonly portfolio: string | null;
}

const text = (v: unknown, max: number): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

/** "Plot 12, MIDC, Pune, Maharashtra" → "Pune, Maharashtra" */
export function cityAndState(address: unknown): string | null {
  const full = text(address, 300);
  if (!full) return null;
  const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
  return parts.slice(-2).join(', ') || null;
}

export function toVendorCard(id: string, data: Record<string, any>): VendorCard {
  const rating = Number(data.rating);
  const years = Number(data.experienceYears);
  return {
    id,
    role: data.role,
    fullName: text(data.fullName, 100),
    teamName: text(data.teamName, 100),
    imageUrl: typeof data.imageUrl === 'string' && /^https:\/\//.test(data.imageUrl) ? data.imageUrl : null,
    isVerified: data.isVerified === true,
    rating: Number.isFinite(rating) ? rating : null,
    location: cityAndState(data.location),
    experienceYears: Number.isFinite(years) ? years : null,
    specializations: Array.isArray(data.specializations)
      ? data.specializations.filter((s: unknown) => typeof s === 'string').slice(0, 12)
      : [],
    portfolio: text(data.portfolio, 500),
  };
}
