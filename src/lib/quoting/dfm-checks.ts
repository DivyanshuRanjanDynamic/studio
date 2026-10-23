// ═══════════════════════════════════════════════════
// DFM Checks — shared helpers for manufacturability issues
// Each engine raises its own issues from the converter's analysis
// (sheet-metal.ts, printing.ts; CNC issues come from the converter).
// ═══════════════════════════════════════════════════

import type { DFMIssue } from '@/types/quoting';

/** Has any blocking DFM issues? */
export function hasBlockingIssues(issues: readonly DFMIssue[]): boolean {
  return issues.some((issue) => issue.blocking);
}
