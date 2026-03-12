import { describe, it, expect } from 'vitest';
import { jsonToFlow } from '../jsonToFlow';
import sampleFlow from './fixtures/sampleFlow.json';

const sampleJson = sampleFlow as Record<string, unknown>;

describe('jsonToFlow', () => {
  it('returns { nodes, edges, metadata } matching FlowTransformResult', () => {
    const result = jsonToFlow(sampleJson);
    expect(result).toHaveProperty('nodes');
    expect(result).toHaveProperty('edges');
    expect(result).toHaveProperty('metadata');
    expect(Array.isArray(result.nodes)).toBe(true);
    expect(Array.isArray(result.edges)).toBe(true);
  });

  it('creates one node per step in the fixture', () => {
    const result = jsonToFlow(sampleJson);
    // sampleFlow.json has 9 steps
    const stepKeys = Object.keys(
      (sampleJson as Record<string, Record<string, unknown>>).steps
    );
    expect(result.nodes).toHaveLength(stepKeys.length);
  });

  it('each node has id equal to the step key', () => {
    const result = jsonToFlow(sampleJson);
    const stepKeys = Object.keys(
      (sampleJson as Record<string, Record<string, unknown>>).steps
    );
    const nodeIds = result.nodes.map((n) => n.id);
    for (const key of stepKeys) {
      expect(nodeIds).toContain(key);
    }
  });

  it('each node has type "default"', () => {
    const result = jsonToFlow(sampleJson);
    for (const node of result.nodes) {
      expect(node.type).toBe('default');
    }
  });

  it('node.data.label uses step.description', () => {
    const result = jsonToFlow(sampleJson);
    const greetingNode = result.nodes.find((n) => n.id === 'greeting');
    expect(greetingNode?.data.label).toBe('Initial greeting');
  });

  it('node.data.step contains the FULL original step object', () => {
    const result = jsonToFlow(sampleJson);
    const verifyNode = result.nodes.find((n) => n.id === 'verify_identity');
    expect(verifyNode?.data.step).toBeDefined();

    const stepData = verifyNode?.data.step as Record<string, unknown>;
    // Check that non-visual fields are preserved (IMP-04)
    expect(stepData.max_clarification_retries).toBe(3);
    expect(stepData.criticalstep).toBe(true);
    expect(stepData.description).toBe('Verify caller identity');
    expect(stepData.conditions).toBeDefined();
    expect(Array.isArray(stepData.conditions)).toBe(true);
  });

  it('node positions use grid layout (4 columns, 300px X gap, 200px Y gap)', () => {
    const result = jsonToFlow(sampleJson);
    // Verify the first few nodes have correct grid positions
    // Node 0: (0, 0)
    expect(result.nodes[0].position).toEqual({ x: 0, y: 0 });
    // Node 1: (300, 0)
    expect(result.nodes[1].position).toEqual({ x: 300, y: 0 });
    // Node 3: (900, 0)
    expect(result.nodes[3].position).toEqual({ x: 900, y: 0 });
    // Node 4: (0, 200) - wraps to next row
    expect(result.nodes[4].position).toEqual({ x: 0, y: 200 });
  });

  it('metadata.stepsKey matches the detected key', () => {
    const result = jsonToFlow(sampleJson);
    expect(result.metadata.stepsKey).toBe('steps');
  });

  it('metadata.wrapperFields contains all non-step keys', () => {
    const result = jsonToFlow(sampleJson);
    expect(result.metadata.wrapperFields).toHaveProperty('flow_name', 'Medicare Enrollment');
    expect(result.metadata.wrapperFields).toHaveProperty('version', '2.1');
    expect(result.metadata.wrapperFields).toHaveProperty('voice_settings');
    expect(
      (result.metadata.wrapperFields.voice_settings as Record<string, unknown>).provider
    ).toBe('elevenlabs');
    // Should NOT contain the steps key
    expect(result.metadata.wrapperFields).not.toHaveProperty('steps');
  });

  it('collects edges from all steps (next, conditions, timeout, no_match, intents)', () => {
    const result = jsonToFlow(sampleJson);
    // Count expected edges from the fixture:
    // greeting: next(verify_identity) + timeout(greeting_retry) = 2
    // greeting_retry: next(verify_identity) + timeout(farewell) = 2
    // verify_identity: 2 conditions(plan_options, manual_lookup) + no_match(verify_retry) + 2 intents(farewell, transfer_agent) = 5
    // plan_options: next(enrollment_confirm) = 1
    // manual_lookup: next(plan_options) + timeout(transfer_agent) = 2
    // verify_retry: next(verify_identity) + timeout(transfer_agent) = 2
    // enrollment_confirm: 2 conditions(farewell, plan_options) + no_match(enrollment_confirm) + timeout(transfer_agent) = 4
    // transfer_agent: no edges (no linking fields)
    // farewell: no edges
    // Total = 2 + 2 + 5 + 1 + 2 + 2 + 4 + 0 + 0 = 18
    expect(result.edges.length).toBe(18);
  });

  it('filters out edges referencing nonexistent target step keys', () => {
    const jsonWithDangling = {
      steps: {
        start: {
          description: 'Start',
          next: 'middle',
          timeout_next: 'nonexistent_step',
        },
        middle: {
          description: 'Middle',
          next: 'end',
        },
        end: {
          description: 'End',
        },
      },
    };

    const result = jsonToFlow(jsonWithDangling);
    // start->next->middle (valid) + start->timeout->nonexistent_step (filtered) + middle->next->end (valid) = 2
    expect(result.edges).toHaveLength(2);
    const targets = result.edges.map((e) => e.target);
    expect(targets).not.toContain('nonexistent_step');
  });

  it('handles empty steps object gracefully', () => {
    // This should throw because detectStepsContainer requires at least 2 steps
    const emptySteps = {
      flow_name: 'Empty',
      steps: {},
    };
    expect(() => jsonToFlow(emptySteps)).toThrow();
  });

  it('node.data.step is a copy, not a reference to the original', () => {
    const result = jsonToFlow(sampleJson);
    const greetingNode = result.nodes.find((n) => n.id === 'greeting');
    const original = (sampleJson as Record<string, Record<string, Record<string, unknown>>>)
      .steps.greeting;

    // Modifying node.data.step should not affect original
    (greetingNode?.data.step as Record<string, unknown>).description = 'MODIFIED';
    expect(original.description).toBe('Initial greeting');
  });
});
