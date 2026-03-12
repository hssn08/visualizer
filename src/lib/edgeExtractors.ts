import type { Edge } from '@xyflow/react';
import { isPlainObject } from './detectSteps';

/**
 * Extract all edges from a single call flow step.
 *
 * Handles 5 linking field types:
 * 1. next (string) -> single "next" edge
 * 2. conditions (array) -> one "condition" edge per entry with a next field
 * 3. timeout_next (string) -> single "timeout" edge
 * 4. no_match_next (string) -> single "no_match" edge
 * 5. intent_detector_routes (object) -> one "intent" edge per key
 *
 * Edge IDs include the type and target to guarantee uniqueness even when
 * multiple edges from the same step target the same node.
 */
export function extractEdgesFromStep(
  stepKey: string,
  step: Record<string, unknown>
): Edge[] {
  const edges: Edge[] = [];

  // 1. Direct "next" field -> single edge
  if (typeof step.next === 'string') {
    edges.push({
      id: `${stepKey}->next->${step.next}`,
      source: stepKey,
      target: step.next,
      type: 'conditional',
      sourceHandle: 'next',
      data: { edgeType: 'next' },
    });
  }

  // 2. "conditions" array -> one edge per condition with a next field
  if (Array.isArray(step.conditions)) {
    (step.conditions as Record<string, unknown>[]).forEach(
      (cond: Record<string, unknown>, i: number) => {
        if (cond.next && typeof cond.next === 'string') {
          const label =
            cond.condition_description || cond.condition || `Condition ${i + 1}`;
          edges.push({
            id: `${stepKey}->condition-${i}->${cond.next}`,
            source: stepKey,
            target: cond.next,
            type: 'conditional',
            sourceHandle: `condition-${i}`,
            label: String(label),
            data: { edgeType: 'condition', conditionIndex: i },
          });
        }
      }
    );
  }

  // 3. "timeout_next" -> single edge
  if (typeof step.timeout_next === 'string') {
    edges.push({
      id: `${stepKey}->timeout->${step.timeout_next}`,
      source: stepKey,
      target: step.timeout_next,
      type: 'conditional',
      sourceHandle: 'timeout',
      label: 'Timeout',
      data: { edgeType: 'timeout' },
    });
  }

  // 4. "no_match_next" -> single edge
  if (typeof step.no_match_next === 'string') {
    edges.push({
      id: `${stepKey}->no_match->${step.no_match_next}`,
      source: stepKey,
      target: step.no_match_next,
      type: 'conditional',
      sourceHandle: 'no_match',
      label: 'No Match',
      data: { edgeType: 'no_match' },
    });
  }

  // 5. "intent_detector_routes" object -> one edge per intent
  if (isPlainObject(step.intent_detector_routes)) {
    const routes = step.intent_detector_routes as Record<string, string>;
    for (const [intentName, targetStep] of Object.entries(routes)) {
      if (typeof targetStep === 'string') {
        edges.push({
          id: `${stepKey}->intent-${intentName}->${targetStep}`,
          source: stepKey,
          target: targetStep,
          type: 'conditional',
          sourceHandle: `intent-${intentName}`,
          label: intentName,
          data: { edgeType: 'intent', intentName },
        });
      }
    }
  }

  return edges;
}
