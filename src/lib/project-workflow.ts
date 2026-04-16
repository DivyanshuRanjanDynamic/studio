export const CANONICAL_PROJECT_STATUSES = [
  'RFQ_SENT',
  'ACCEPTED',
  'QUOTATION_SENT',
  'APPROVED_BY_CUSTOMER',
  'IN_PRODUCTION',
  'QUALITY_CHECK',
  'DISPATCHED',
  'DELIVERED',
] as const;

export type CanonicalProjectStatus = (typeof CANONICAL_PROJECT_STATUSES)[number];

const LEGACY_TO_CANONICAL: Record<string, CanonicalProjectStatus> = {
  quote_requested: 'RFQ_SENT',
  quotation_sent: 'QUOTATION_SENT',
  assigned: 'ACCEPTED',
  accepted: 'ACCEPTED',
  in_production: 'IN_PRODUCTION',
  shipping: 'DISPATCHED',
  shipped: 'DISPATCHED',
  delivered: 'DELIVERED',
  completed: 'DELIVERED',
};

const CANONICAL_TO_LEGACY: Record<CanonicalProjectStatus, string> = {
  RFQ_SENT: 'quote_requested',
  ACCEPTED: 'accepted',
  QUOTATION_SENT: 'quotation_sent',
  APPROVED_BY_CUSTOMER: 'deposit_pending',
  IN_PRODUCTION: 'in_production',
  QUALITY_CHECK: 'in_production',
  DISPATCHED: 'shipped',
  DELIVERED: 'delivered',
};

const ALLOWED_TRANSITIONS: Record<CanonicalProjectStatus, CanonicalProjectStatus[]> = {
  RFQ_SENT: ['ACCEPTED'],
  ACCEPTED: ['QUOTATION_SENT'],
  QUOTATION_SENT: ['APPROVED_BY_CUSTOMER'],
  APPROVED_BY_CUSTOMER: ['IN_PRODUCTION'],
  IN_PRODUCTION: ['QUALITY_CHECK'],
  QUALITY_CHECK: ['DISPATCHED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: [],
};

export function normalizeWorkflowStatus(
  workflowStatus?: string | null,
  legacyStatus?: string | null
): CanonicalProjectStatus | null {
  if (workflowStatus && CANONICAL_PROJECT_STATUSES.includes(workflowStatus as CanonicalProjectStatus)) {
    return workflowStatus as CanonicalProjectStatus;
  }
  if (!legacyStatus) return null;
  return LEGACY_TO_CANONICAL[legacyStatus] ?? null;
}

export function toLegacyStatus(status: CanonicalProjectStatus): string {
  return CANONICAL_TO_LEGACY[status];
}

export function canTransitionStatus(
  from: CanonicalProjectStatus,
  to: CanonicalProjectStatus
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function workflowTransitionError(
  from: CanonicalProjectStatus,
  to: CanonicalProjectStatus
): string {
  return `Invalid status transition from ${from} to ${to}`;
}
