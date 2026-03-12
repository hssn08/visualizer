import { describe, it, expect } from 'vitest';
import { extractEdgesFromStep } from '../edgeExtractors';

describe('extractEdgesFromStep', () => {
  it('extracts a "next" edge with edgeType "next"', () => {
    const step = { next: 'step_b', description: 'Test' };
    const edges = extractEdgesFromStep('step_a', step);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      id: 'step_a->next->step_b',
      source: 'step_a',
      target: 'step_b',
      type: 'conditional',
      sourceHandle: 'next',
      data: { edgeType: 'next' },
    });
  });

  it('extracts condition edges with edgeType "condition" from conditions array', () => {
    const step = {
      conditions: [
        { condition: 'yes', condition_description: 'Confirmed', next: 'confirm' },
        { condition: 'no', condition_description: 'Denied', next: 'deny' },
      ],
    };
    const edges = extractEdgesFromStep('decision', step);

    expect(edges).toHaveLength(2);
    expect(edges[0]).toMatchObject({
      id: 'decision->condition-0->confirm',
      source: 'decision',
      target: 'confirm',
      type: 'conditional',
      sourceHandle: 'condition-0',
      label: 'Confirmed',
      data: { edgeType: 'condition', conditionIndex: 0 },
    });
    expect(edges[1]).toMatchObject({
      id: 'decision->condition-1->deny',
      source: 'decision',
      target: 'deny',
      type: 'conditional',
      sourceHandle: 'condition-1',
      label: 'Denied',
      data: { edgeType: 'condition', conditionIndex: 1 },
    });
  });

  it('uses condition field as label fallback when condition_description is missing', () => {
    const step = {
      conditions: [
        { condition: 'verified', next: 'next_step' },
      ],
    };
    const edges = extractEdgesFromStep('check', step);
    expect(edges[0].label).toBe('verified');
  });

  it('uses "Condition N" as label when both description and condition are missing', () => {
    const step = {
      conditions: [
        { next: 'next_step' },
      ],
    };
    const edges = extractEdgesFromStep('check', step);
    expect(edges[0].label).toBe('Condition 1');
  });

  it('extracts timeout edge with edgeType "timeout"', () => {
    const step = { timeout_next: 'retry_step', timeout: 10 };
    const edges = extractEdgesFromStep('wait', step);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      id: 'wait->timeout->retry_step',
      source: 'wait',
      target: 'retry_step',
      type: 'conditional',
      sourceHandle: 'timeout',
      label: 'Timeout',
      data: { edgeType: 'timeout' },
    });
  });

  it('extracts no_match edge with edgeType "no_match"', () => {
    const step = { no_match_next: 'fallback' };
    const edges = extractEdgesFromStep('input', step);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      id: 'input->no_match->fallback',
      source: 'input',
      target: 'fallback',
      type: 'conditional',
      sourceHandle: 'no_match',
      label: 'No Match',
      data: { edgeType: 'no_match' },
    });
  });

  it('extracts intent edges with edgeType "intent" from intent_detector_routes', () => {
    const step = {
      intent_detector_routes: {
        hangup_request: 'farewell',
        speak_to_agent: 'transfer',
      },
    };
    const edges = extractEdgesFromStep('verify', step);

    expect(edges).toHaveLength(2);

    const hangupEdge = edges.find((e) => e.id === 'verify->intent-hangup_request->farewell');
    expect(hangupEdge).toMatchObject({
      source: 'verify',
      target: 'farewell',
      type: 'conditional',
      sourceHandle: 'intent-hangup_request',
      label: 'hangup_request',
      data: { edgeType: 'intent', intentName: 'hangup_request' },
    });

    const agentEdge = edges.find((e) => e.id === 'verify->intent-speak_to_agent->transfer');
    expect(agentEdge).toMatchObject({
      source: 'verify',
      target: 'transfer',
      type: 'conditional',
      sourceHandle: 'intent-speak_to_agent',
      label: 'speak_to_agent',
      data: { edgeType: 'intent', intentName: 'speak_to_agent' },
    });
  });

  it('produces unique edge IDs even when multiple edges target the same node', () => {
    const step = {
      next: 'same_target',
      timeout_next: 'same_target',
      no_match_next: 'same_target',
    };
    const edges = extractEdgesFromStep('origin', step);

    expect(edges).toHaveLength(3);
    const ids = edges.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('returns empty array for steps with no linking fields', () => {
    const step = { description: 'Dead end', text: 'Goodbye', action: 'hangup' };
    const edges = extractEdgesFromStep('terminal', step);
    expect(edges).toHaveLength(0);
  });

  it('handles all edge types on a single step', () => {
    const step = {
      next: 'next_step',
      timeout_next: 'timeout_step',
      no_match_next: 'nomatch_step',
      conditions: [
        { condition_description: 'Option A', next: 'opt_a' },
      ],
      intent_detector_routes: {
        help: 'help_step',
      },
    };
    const edges = extractEdgesFromStep('complex', step);

    // next + timeout + no_match + 1 condition + 1 intent = 5 edges
    expect(edges).toHaveLength(5);

    const types = edges.map((e) => e.data?.edgeType);
    expect(types).toContain('next');
    expect(types).toContain('timeout');
    expect(types).toContain('no_match');
    expect(types).toContain('condition');
    expect(types).toContain('intent');
  });

  it('skips conditions without a next field', () => {
    const step = {
      conditions: [
        { condition_description: 'Has next', next: 'target' },
        { condition_description: 'No next' },
      ],
    };
    const edges = extractEdgesFromStep('check', step);
    expect(edges).toHaveLength(1);
  });

  it('ignores next field when value is null', () => {
    const step = { next: null };
    const edges = extractEdgesFromStep('end', step);
    expect(edges).toHaveLength(0);
  });

  it('sets type "conditional" on every edge for custom edge rendering', () => {
    const step = {
      next: 'next_step',
      timeout_next: 'timeout_step',
      no_match_next: 'nomatch_step',
      conditions: [
        { condition_description: 'Option A', next: 'opt_a' },
      ],
      intent_detector_routes: {
        help: 'help_step',
      },
    };
    const edges = extractEdgesFromStep('all_types', step);

    expect(edges).toHaveLength(5);
    for (const edge of edges) {
      expect(edge.type).toBe('conditional');
    }
  });
});
