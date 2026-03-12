import { describe, it, expect } from 'vitest';
import { jsonToFlow } from '../jsonToFlow';
import { flowToJson } from '../flowToJson';
import sampleFlow from './fixtures/sampleFlow.json';

describe('Round-trip: jsonToFlow -> flowToJson', () => {
  it('produces JSON with identical structure to input', () => {
    const { nodes, edges, metadata } = jsonToFlow(sampleFlow as Record<string, unknown>);
    const output = flowToJson(nodes, edges, metadata);

    // Normalize both through JSON serialization to compare
    const inputNormalized = JSON.parse(JSON.stringify(sampleFlow));
    const outputNormalized = JSON.parse(JSON.stringify(output));

    expect(outputNormalized).toEqual(inputNormalized);
  });

  it('preserves flow_name, version, and voice_settings wrapper fields', () => {
    const { nodes, edges, metadata } = jsonToFlow(sampleFlow as Record<string, unknown>);
    const output = flowToJson(nodes, edges, metadata);

    expect(output.flow_name).toBe('Medicare Enrollment');
    expect(output.version).toBe('2.1');
    expect(output.voice_settings).toEqual({
      provider: 'elevenlabs',
      voice_id: 'abc123',
    });
  });

  it('preserves max_clarification_retries and criticalstep in step data', () => {
    const { nodes, edges, metadata } = jsonToFlow(sampleFlow as Record<string, unknown>);
    const output = flowToJson(nodes, edges, metadata);
    const steps = output.steps as Record<string, Record<string, unknown>>;

    expect(steps.verify_identity.max_clarification_retries).toBe(3);
    expect(steps.verify_identity.criticalstep).toBe(true);
  });

  it('preserves action and disposition fields on terminal steps', () => {
    const { nodes, edges, metadata } = jsonToFlow(sampleFlow as Record<string, unknown>);
    const output = flowToJson(nodes, edges, metadata);
    const steps = output.steps as Record<string, Record<string, unknown>>;

    expect(steps.transfer_agent.action).toBe('transfer');
    expect(steps.transfer_agent.disposition).toBe('transferred');
    expect(steps.farewell.action).toBe('hangup');
    expect(steps.farewell.disposition).toBe('completed');
  });

  it('preserves all condition objects with non-next fields', () => {
    const { nodes, edges, metadata } = jsonToFlow(sampleFlow as Record<string, unknown>);
    const output = flowToJson(nodes, edges, metadata);
    const steps = output.steps as Record<string, Record<string, unknown>>;

    const conditions = steps.verify_identity.conditions as Array<Record<string, unknown>>;
    expect(conditions).toHaveLength(2);
    expect(conditions[0].condition).toBe('id_verified');
    expect(conditions[0].condition_description).toBe('ID verified');
    expect(conditions[0].next).toBe('plan_options');
    expect(conditions[1].condition).toBe('id_not_found');
    expect(conditions[1].condition_description).toBe('ID not found');
    expect(conditions[1].next).toBe('manual_lookup');
  });

  it('preserves intent_detector_routes', () => {
    const { nodes, edges, metadata } = jsonToFlow(sampleFlow as Record<string, unknown>);
    const output = flowToJson(nodes, edges, metadata);
    const steps = output.steps as Record<string, Record<string, unknown>>;

    expect(steps.verify_identity.intent_detector_routes).toEqual({
      hangup_request: 'farewell',
      speak_to_agent: 'transfer_agent',
    });
  });
});
