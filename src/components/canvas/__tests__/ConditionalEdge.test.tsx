import { describe, it, expect } from 'vitest';
import { EDGE_STYLES, LABEL_STYLES, getEdgeStyle } from '../ConditionalEdge';

describe('EDGE_STYLES', () => {
  it('defines "next" as solid slate (#64748b) with no dash', () => {
    expect(EDGE_STYLES.next).toEqual({ stroke: '#64748b' });
    expect(EDGE_STYLES.next.strokeDasharray).toBeUndefined();
  });

  it('defines "condition" as solid blue (#3b82f6) with no dash', () => {
    expect(EDGE_STYLES.condition).toEqual({ stroke: '#3b82f6' });
    expect(EDGE_STYLES.condition.strokeDasharray).toBeUndefined();
  });

  it('defines "timeout" as dashed orange (#f97316, 8,4)', () => {
    expect(EDGE_STYLES.timeout).toEqual({
      stroke: '#f97316',
      strokeDasharray: '8,4',
    });
  });

  it('defines "no_match" as dashed gray (#9ca3af, 8,4)', () => {
    expect(EDGE_STYLES.no_match).toEqual({
      stroke: '#9ca3af',
      strokeDasharray: '8,4',
    });
  });

  it('defines "intent" as dotted red (#ef4444, 3,3)', () => {
    expect(EDGE_STYLES.intent).toEqual({
      stroke: '#ef4444',
      strokeDasharray: '3,3',
    });
  });

  it('has exactly 5 edge type entries', () => {
    expect(Object.keys(EDGE_STYLES)).toHaveLength(5);
  });
});

describe('getEdgeStyle', () => {
  it('returns "next" style for edgeType "next"', () => {
    const style = getEdgeStyle('next');
    expect(style).toEqual({ stroke: '#64748b' });
  });

  it('returns "condition" style for edgeType "condition"', () => {
    const style = getEdgeStyle('condition');
    expect(style).toEqual({ stroke: '#3b82f6' });
  });

  it('returns dashed orange style for edgeType "timeout"', () => {
    const style = getEdgeStyle('timeout');
    expect(style).toEqual({ stroke: '#f97316', strokeDasharray: '8,4' });
  });

  it('returns dashed gray style for edgeType "no_match"', () => {
    const style = getEdgeStyle('no_match');
    expect(style).toEqual({ stroke: '#9ca3af', strokeDasharray: '8,4' });
  });

  it('returns dotted red style for edgeType "intent"', () => {
    const style = getEdgeStyle('intent');
    expect(style).toEqual({ stroke: '#ef4444', strokeDasharray: '3,3' });
  });

  it('falls back to "next" style for unknown edgeType', () => {
    const style = getEdgeStyle('unknown_type');
    expect(style).toEqual(EDGE_STYLES.next);
  });

  it('falls back to "next" style for empty string', () => {
    const style = getEdgeStyle('');
    expect(style).toEqual(EDGE_STYLES.next);
  });
});

describe('LABEL_STYLES', () => {
  it('defines "next" label style with neutral/white colors', () => {
    expect(LABEL_STYLES.next).toBeDefined();
    expect(LABEL_STYLES.next).toContain('bg-white');
  });

  it('defines "condition" label style with blue colors', () => {
    expect(LABEL_STYLES.condition).toBeDefined();
    expect(LABEL_STYLES.condition).toContain('bg-blue-50');
    expect(LABEL_STYLES.condition).toContain('border-blue-200');
    expect(LABEL_STYLES.condition).toContain('text-blue-700');
  });

  it('defines "timeout" label style with orange colors', () => {
    expect(LABEL_STYLES.timeout).toBeDefined();
    expect(LABEL_STYLES.timeout).toContain('bg-orange-50');
    expect(LABEL_STYLES.timeout).toContain('border-orange-200');
    expect(LABEL_STYLES.timeout).toContain('text-orange-700');
  });

  it('defines "no_match" label style with gray colors', () => {
    expect(LABEL_STYLES.no_match).toBeDefined();
    expect(LABEL_STYLES.no_match).toContain('bg-gray-50');
    expect(LABEL_STYLES.no_match).toContain('border-gray-200');
    expect(LABEL_STYLES.no_match).toContain('text-gray-600');
  });

  it('defines "intent" label style with red colors', () => {
    expect(LABEL_STYLES.intent).toBeDefined();
    expect(LABEL_STYLES.intent).toContain('bg-red-50');
    expect(LABEL_STYLES.intent).toContain('border-red-200');
    expect(LABEL_STYLES.intent).toContain('text-red-700');
  });

  it('has exactly 5 label style entries', () => {
    expect(Object.keys(LABEL_STYLES)).toHaveLength(5);
  });
});
