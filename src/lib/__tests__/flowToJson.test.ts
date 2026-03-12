import { describe, it, expect } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import { flowToJson } from '../flowToJson';
import type { JsonMetadata } from '../types';

describe('flowToJson', () => {
  const makeNode = (
    id: string,
    step: Record<string, unknown>
  ): Node => ({
    id,
    type: 'default',
    position: { x: 0, y: 0 },
    data: { label: id, step: { ...step } },
  });

  const makeEdge = (
    id: string,
    source: string,
    target: string,
    edgeType: string,
    extra: Record<string, unknown> = {}
  ): Edge => ({
    id,
    source,
    target,
    data: { edgeType, ...extra },
  });

  const baseMeta: JsonMetadata = {
    stepsKey: 'steps',
    wrapperFields: { flow_name: 'Test Flow', version: '1.0' },
  };

  it('reconstructs JSON with wrapper fields at top level', () => {
    const nodes = [makeNode('step1', { description: 'Hello', next: 'step2' })];
    const edges = [makeEdge('e1', 'step1', 'step2', 'next')];

    const result = flowToJson(nodes, edges, baseMeta);

    expect(result.flow_name).toBe('Test Flow');
    expect(result.version).toBe('1.0');
  });

  it('places rebuilt steps at metadata.stepsKey', () => {
    const nodes = [makeNode('greeting', { description: 'Hi' })];
    const result = flowToJson(nodes, [], baseMeta);

    expect(result.steps).toBeDefined();
    expect(typeof result.steps).toBe('object');
    expect((result.steps as Record<string, unknown>).greeting).toBeDefined();
  });

  it('preserves all original fields from node.data.step', () => {
    const nodes = [
      makeNode('step1', {
        description: 'Verify',
        text: 'Please verify',
        wait_for_response: true,
        max_clarification_retries: 3,
        criticalstep: true,
      }),
    ];

    const result = flowToJson(nodes, [], baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).step1;

    expect(step.description).toBe('Verify');
    expect(step.text).toBe('Please verify');
    expect(step.wait_for_response).toBe(true);
    expect(step.max_clarification_retries).toBe(3);
    expect(step.criticalstep).toBe(true);
  });

  it('updates "next" field from edge with edgeType "next"', () => {
    const nodes = [
      makeNode('a', { description: 'A', next: 'old_target' }),
      makeNode('b', { description: 'B' }),
    ];
    const edges = [makeEdge('e1', 'a', 'b', 'next')];

    const result = flowToJson(nodes, edges, baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).a;

    expect(step.next).toBe('b');
  });

  it('deletes "next" field when no next edge exists', () => {
    const nodes = [makeNode('a', { description: 'A', next: 'some_target' })];
    // No edges at all
    const result = flowToJson(nodes, [], baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).a;

    expect(step).not.toHaveProperty('next');
  });

  it('updates conditions[i].next from condition edges', () => {
    const nodes = [
      makeNode('step1', {
        description: 'Check',
        conditions: [
          { condition: 'yes', condition_description: 'Yes', next: 'old1' },
          { condition: 'no', condition_description: 'No', next: 'old2' },
        ],
      }),
    ];
    const edges = [
      makeEdge('e1', 'step1', 'newTarget1', 'condition', { conditionIndex: 0 }),
      makeEdge('e2', 'step1', 'newTarget2', 'condition', { conditionIndex: 1 }),
    ];

    const result = flowToJson(nodes, edges, baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).step1;
    const conditions = step.conditions as Array<Record<string, unknown>>;

    expect(conditions[0].next).toBe('newTarget1');
    expect(conditions[1].next).toBe('newTarget2');
    // Non-next fields preserved
    expect(conditions[0].condition).toBe('yes');
    expect(conditions[0].condition_description).toBe('Yes');
  });

  it('updates timeout_next from timeout edge', () => {
    const nodes = [makeNode('a', { description: 'A', timeout_next: 'old' })];
    const edges = [makeEdge('e1', 'a', 'newTimeout', 'timeout')];

    const result = flowToJson(nodes, edges, baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).a;

    expect(step.timeout_next).toBe('newTimeout');
  });

  it('deletes timeout_next when no timeout edge exists', () => {
    const nodes = [makeNode('a', { description: 'A', timeout_next: 'some' })];
    const result = flowToJson(nodes, [], baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).a;

    expect(step).not.toHaveProperty('timeout_next');
  });

  it('updates no_match_next from no_match edge', () => {
    const nodes = [makeNode('a', { description: 'A', no_match_next: 'old' })];
    const edges = [makeEdge('e1', 'a', 'newNoMatch', 'no_match')];

    const result = flowToJson(nodes, edges, baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).a;

    expect(step.no_match_next).toBe('newNoMatch');
  });

  it('deletes no_match_next when no no_match edge exists', () => {
    const nodes = [makeNode('a', { description: 'A', no_match_next: 'old' })];
    const result = flowToJson(nodes, [], baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).a;

    expect(step).not.toHaveProperty('no_match_next');
  });

  it('rebuilds intent_detector_routes from intent edges', () => {
    const nodes = [
      makeNode('a', {
        description: 'A',
        intent_detector_routes: { old_intent: 'old_target' },
      }),
    ];
    const edges = [
      makeEdge('e1', 'a', 'target1', 'intent', { intentName: 'hangup' }),
      makeEdge('e2', 'a', 'target2', 'intent', { intentName: 'transfer' }),
    ];

    const result = flowToJson(nodes, edges, baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).a;
    const routes = step.intent_detector_routes as Record<string, string>;

    expect(routes.hangup).toBe('target1');
    expect(routes.transfer).toBe('target2');
  });

  it('deletes intent_detector_routes when no intent edges exist', () => {
    const nodes = [
      makeNode('a', {
        description: 'A',
        intent_detector_routes: { old_intent: 'old_target' },
      }),
    ];
    const result = flowToJson(nodes, [], baseMeta);
    const step = (result.steps as Record<string, Record<string, unknown>>).a;

    expect(step).not.toHaveProperty('intent_detector_routes');
  });
});
