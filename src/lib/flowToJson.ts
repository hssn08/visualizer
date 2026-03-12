import type { Node, Edge } from '@xyflow/react';
import type { JsonMetadata } from './types';

/**
 * Convert React Flow nodes, edges, and metadata back into the original JSON structure.
 *
 * This is the reverse of jsonToFlow:
 * 1. Spread metadata.wrapperFields to restore top-level fields
 * 2. Rebuild each step from node.data.step, updating connection fields from edges
 * 3. Place steps at result[metadata.stepsKey]
 *
 * Connection fields (next, conditions[i].next, timeout_next, no_match_next,
 * intent_detector_routes) are always derived from the current edge state,
 * ensuring the exported JSON reflects any changes the user made on the canvas.
 */
export function flowToJson(
  nodes: Node[],
  edges: Edge[],
  metadata: JsonMetadata
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...metadata.wrapperFields };

  const steps: Record<string, Record<string, unknown>> = {};

  for (const node of nodes) {
    const step = { ...(node.data.step as Record<string, unknown>) };
    updateConnectionFields(step, node.id, edges);
    steps[node.id] = step;
  }

  result[metadata.stepsKey] = steps;

  return result;
}

/**
 * Update all connection fields on a step based on the current edges.
 *
 * Uses `delete` for absent connections so JSON.stringify produces clean output
 * (no "field": null or "field": undefined entries).
 */
function updateConnectionFields(
  step: Record<string, unknown>,
  nodeId: string,
  edges: Edge[]
): void {
  const outgoing = edges.filter((e) => e.source === nodeId);

  // 1. "next" field from edgeType "next"
  const nextEdge = outgoing.find((e) => e.data?.edgeType === 'next');
  if (nextEdge) {
    step.next = nextEdge.target;
  } else {
    delete step.next;
  }

  // 2. "conditions[i].next" from edgeType "condition"
  if (Array.isArray(step.conditions)) {
    const conditions = (step.conditions as Record<string, unknown>[]).map(
      (cond) => ({ ...cond })
    );
    const conditionEdges = outgoing.filter(
      (e) => e.data?.edgeType === 'condition'
    );
    for (const condEdge of conditionEdges) {
      const idx = condEdge.data?.conditionIndex as number;
      if (idx != null && idx >= 0 && idx < conditions.length) {
        conditions[idx].next = condEdge.target;
      }
    }
    step.conditions = conditions;
  }

  // 3. "timeout_next" from edgeType "timeout"
  const timeoutEdge = outgoing.find((e) => e.data?.edgeType === 'timeout');
  if (timeoutEdge) {
    step.timeout_next = timeoutEdge.target;
  } else {
    delete step.timeout_next;
  }

  // 4. "no_match_next" from edgeType "no_match"
  const noMatchEdge = outgoing.find((e) => e.data?.edgeType === 'no_match');
  if (noMatchEdge) {
    step.no_match_next = noMatchEdge.target;
  } else {
    delete step.no_match_next;
  }

  // 5. "intent_detector_routes" from edgeType "intent"
  const intentEdges = outgoing.filter((e) => e.data?.edgeType === 'intent');
  if (intentEdges.length > 0) {
    const routes: Record<string, string> = {};
    for (const ie of intentEdges) {
      const intentName = ie.data?.intentName as string;
      if (intentName) {
        routes[intentName] = ie.target;
      }
    }
    step.intent_detector_routes = routes;
  } else {
    delete step.intent_detector_routes;
  }
}
