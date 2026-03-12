import { describe, it, expect } from 'vitest';
import { detectStepsContainer, isPlainObject } from '../detectSteps';
import sampleFlow from './fixtures/sampleFlow.json';

describe('isPlainObject', () => {
  it('returns true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('returns false for arrays', () => {
    expect(isPlainObject([])).toBe(false);
  });

  it('returns false for null', () => {
    expect(isPlainObject(null)).toBe(false);
  });

  it('returns false for primitives', () => {
    expect(isPlainObject('string')).toBe(false);
    expect(isPlainObject(42)).toBe(false);
    expect(isPlainObject(undefined)).toBe(false);
  });
});

describe('detectStepsContainer', () => {
  it('finds the "steps" key in sample JSON', () => {
    const result = detectStepsContainer(sampleFlow as Record<string, unknown>);
    expect(result.stepsKey).toBe('steps');
    expect(Object.keys(result.steps).length).toBeGreaterThanOrEqual(2);
  });

  it('returns step objects keyed by step name', () => {
    const result = detectStepsContainer(sampleFlow as Record<string, unknown>);
    expect(result.steps).toHaveProperty('greeting');
    expect(result.steps).toHaveProperty('verify_identity');
    expect(result.steps).toHaveProperty('transfer_agent');
  });

  it('throws descriptive error when no valid steps container is found', () => {
    const noSteps = { name: 'test', version: '1.0', config: { debug: true } };
    expect(() => detectStepsContainer(noSteps)).toThrow(
      /could not detect steps container/i
    );
  });

  it('throws when JSON has only primitives at top level', () => {
    const primitiveOnly = { name: 'test', count: 5, active: true };
    expect(() => detectStepsContainer(primitiveOnly)).toThrow();
  });

  it('picks the key with highest linking field count when multiple candidates exist', () => {
    const multiCandidate = {
      settings: {
        option_a: { value: 'x', next: 'option_b' },
        option_b: { value: 'y' },
      },
      steps: {
        step_one: { next: 'step_two', timeout_next: 'step_three', description: 'First' },
        step_two: { next: 'step_three', conditions: [], description: 'Second' },
        step_three: { description: 'Third' },
      },
    };
    const result = detectStepsContainer(multiCandidate);
    expect(result.stepsKey).toBe('steps');
  });

  it('works for single-level nested keys with objects containing linking fields', () => {
    const nested = {
      metadata: { version: '1.0' },
      call_flow: {
        start: { next: 'middle', description: 'Start step' },
        middle: { next: 'end', timeout_next: 'start', description: 'Middle step' },
        end: { description: 'End step' },
      },
    };
    const result = detectStepsContainer(nested);
    expect(result.stepsKey).toBe('call_flow');
    expect(result.steps).toHaveProperty('start');
    expect(result.steps).toHaveProperty('middle');
  });

  it('requires at least 2 step objects to avoid false positives', () => {
    const singleStep = {
      config: {
        only_one: { next: 'somewhere', description: 'Alone' },
      },
    };
    expect(() => detectStepsContainer(singleStep)).toThrow(
      /could not detect steps container/i
    );
  });

  it('ignores arrays at top level', () => {
    const withArray = {
      items: [{ next: 'a' }, { next: 'b' }],
      steps: {
        a: { next: 'b', description: 'Step A' },
        b: { next: 'a', description: 'Step B' },
      },
    };
    const result = detectStepsContainer(withArray);
    expect(result.stepsKey).toBe('steps');
  });
});
