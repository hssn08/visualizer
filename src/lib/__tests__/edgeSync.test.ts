import { describe, it, expect } from 'vitest';
import { deriveEdgeType, syncEdgeCreateToStep, syncEdgeDeleteToStep } from '../edgeSync';

describe('edgeSync', () => {
  describe('deriveEdgeType', () => {
    it('returns "next" for "next" handle', () => {
      expect(deriveEdgeType('next')).toBe('next');
    });

    it('returns "next" for null handle (default)', () => {
      expect(deriveEdgeType(null)).toBe('next');
    });

    it('returns "timeout" for "timeout" handle', () => {
      expect(deriveEdgeType('timeout')).toBe('timeout');
    });

    it('returns "no_match" for "no_match" handle', () => {
      expect(deriveEdgeType('no_match')).toBe('no_match');
    });

    it('returns "condition" for "condition-0" handle', () => {
      expect(deriveEdgeType('condition-0')).toBe('condition');
    });

    it('returns "condition" for "condition-3" handle', () => {
      expect(deriveEdgeType('condition-3')).toBe('condition');
    });

    it('returns "intent" for "intent-DNC" handle', () => {
      expect(deriveEdgeType('intent-DNC')).toBe('intent');
    });

    it('returns "intent" for "intent-sales" handle', () => {
      expect(deriveEdgeType('intent-sales')).toBe('intent');
    });
  });

  describe('syncEdgeCreateToStep', () => {
    it('returns { next: targetId } for "next" handle', () => {
      expect(syncEdgeCreateToStep('next', 'step_b')).toEqual({ next: 'step_b' });
    });

    it('returns { next: targetId } for null handle (default)', () => {
      expect(syncEdgeCreateToStep(null, 'step_c')).toEqual({ next: 'step_c' });
    });

    it('returns { timeout_next: targetId } for "timeout" handle', () => {
      expect(syncEdgeCreateToStep('timeout', 'step_d')).toEqual({ timeout_next: 'step_d' });
    });

    it('returns { no_match_next: targetId } for "no_match" handle', () => {
      expect(syncEdgeCreateToStep('no_match', 'step_e')).toEqual({ no_match_next: 'step_e' });
    });
  });

  describe('syncEdgeDeleteToStep', () => {
    it('returns { next: undefined } for edge with edgeType "next"', () => {
      const edge = {
        id: 'a->next->b',
        source: 'a',
        target: 'b',
        data: { edgeType: 'next' },
      };
      expect(syncEdgeDeleteToStep(edge)).toEqual({ next: undefined });
    });

    it('returns { timeout_next: undefined } for edge with edgeType "timeout"', () => {
      const edge = {
        id: 'a->timeout->b',
        source: 'a',
        target: 'b',
        data: { edgeType: 'timeout' },
      };
      expect(syncEdgeDeleteToStep(edge)).toEqual({ timeout_next: undefined });
    });

    it('returns { no_match_next: undefined } for edge with edgeType "no_match"', () => {
      const edge = {
        id: 'a->no_match->b',
        source: 'a',
        target: 'b',
        data: { edgeType: 'no_match' },
      };
      expect(syncEdgeDeleteToStep(edge)).toEqual({ no_match_next: undefined });
    });

    it('returns empty object for unknown edgeType', () => {
      const edge = {
        id: 'a->unknown->b',
        source: 'a',
        target: 'b',
        data: { edgeType: 'unknown' },
      };
      expect(syncEdgeDeleteToStep(edge)).toEqual({});
    });
  });
});
