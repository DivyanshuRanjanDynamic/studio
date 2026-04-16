import { describe, it, expect } from 'vitest';
import { 
  canTransitionStatus, 
  normalizeWorkflowStatus, 
  toLegacyStatus,
  CanonicalProjectStatus 
} from '../project-workflow';

describe('Project Workflow State Machine', () => {
  describe('canTransitionStatus', () => {
    it('allows valid initial transition from RFQ_SENT to ACCEPTED', () => {
      expect(canTransitionStatus('RFQ_SENT', 'ACCEPTED')).toBe(true);
    });

    it('denies jumping from RFQ_SENT to IN_PRODUCTION', () => {
      expect(canTransitionStatus('RFQ_SENT', 'IN_PRODUCTION')).toBe(false);
    });

    it('allows linear flow from ACCEPTED to QUOTATION_SENT', () => {
      expect(canTransitionStatus('ACCEPTED', 'QUOTATION_SENT')).toBe(true);
    });

    it('allows flow into IN_PRODUCTION from APPROVED_BY_CUSTOMER', () => {
      expect(canTransitionStatus('APPROVED_BY_CUSTOMER', 'IN_PRODUCTION')).toBe(true);
    });

    it('denies backward transitions (e.g., IN_PRODUCTION to ACCEPTED)', () => {
      expect(canTransitionStatus('IN_PRODUCTION', 'ACCEPTED')).toBe(false);
    });

    it('denies transitions from terminal DELIVERED status', () => {
      expect(canTransitionStatus('DELIVERED', 'RFQ_SENT')).toBe(false);
    });
  });

  describe('normalizeWorkflowStatus', () => {
    it('prefers workflowStatus if valid', () => {
      expect(normalizeWorkflowStatus('RFQ_SENT', 'draft')).toBe('RFQ_SENT');
    });

    it('maps legacy status if workflowStatus is missing', () => {
      expect(normalizeWorkflowStatus(null, 'quote_requested')).toBe('RFQ_SENT');
      expect(normalizeWorkflowStatus(undefined, 'in_production')).toBe('IN_PRODUCTION');
    });

    it('returns null if both are missing or invalid', () => {
      expect(normalizeWorkflowStatus(null, null)).toBe(null);
      expect(normalizeWorkflowStatus('INVALID', 'unknown')).toBe(null);
    });
  });

  describe('toLegacyStatus', () => {
    it('correctly maps canonical to legacy strings', () => {
      expect(toLegacyStatus('RFQ_SENT')).toBe('quote_requested');
      expect(toLegacyStatus('ACCEPTED')).toBe('accepted');
      expect(toLegacyStatus('IN_PRODUCTION')).toBe('in_production');
      expect(toLegacyStatus('DELIVERED')).toBe('delivered');
    });
  });
});
