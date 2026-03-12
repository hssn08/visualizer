import type { Node, Edge } from '@xyflow/react';
import { detectStepsContainer } from './detectSteps';
import { extractEdgesFromStep } from './edgeExtractors';
import type { FlowTransformResult, JsonMetadata } from './types';

/** Grid layout constants (temporary until Phase 3 adds dagre auto-layout) */
const COLS = 4;
const X_GAP = 300;
const Y_GAP = 200;

/**
 * Convert a raw call flow JSON object into React Flow nodes, edges, and metadata.
 *
 * 1. Detects which top-level key contains the steps (via linking field heuristic)
 * 2. Converts each step into a React Flow node with full step data preserved
 * 3. Extracts all edges (next, conditions, timeout, no_match, intent routes)
 * 4. Filters out dangling edges that reference nonexistent step keys
 * 5. Collects wrapper fields (everything except steps) for lossless round-trip
 *
 * @throws {Error} if no valid steps container is detected in the JSON
 */
export function jsonToFlow(rawJson: Record<string, unknown>): FlowTransformResult {
  const { stepsKey, steps } = detectStepsContainer(rawJson);

  // Preserve everything except the steps container
  const wrapperFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawJson)) {
    if (key !== stepsKey) {
      wrapperFields[key] = value;
    }
  }

  const nodes = stepsToNodes(steps);
  const stepKeys = new Set(Object.keys(steps));
  const allEdges = stepsToEdges(steps);

  // Filter out dangling edges whose target is not in the set of known step keys
  const edges = allEdges.filter((edge) => stepKeys.has(edge.target));

  const metadata: JsonMetadata = { stepsKey, wrapperFields };

  return { nodes, edges, metadata };
}

/**
 * Convert step objects into React Flow nodes with grid positions.
 * Each node stores the full original step object in node.data.step (IMP-04).
 * Nodes use type: 'step' to render via the custom StepNode component.
 */
function stepsToNodes(
  steps: Record<string, Record<string, unknown>>
): Node[] {
  const entries = Object.entries(steps);

  return entries.map(([key, step], i) => ({
    id: key,
    type: 'step' as const,
    position: {
      x: (i % COLS) * X_GAP,
      y: Math.floor(i / COLS) * Y_GAP,
    },
    data: {
      label: (step.description as string) || (step.name as string) || key,
      step: { ...step },
      isFirstNode: i === 0,
    },
  }));
}

/**
 * Extract edges from all steps using the edge extractor.
 */
function stepsToEdges(
  steps: Record<string, Record<string, unknown>>
): Edge[] {
  const edges: Edge[] = [];

  for (const [stepKey, step] of Object.entries(steps)) {
    const stepEdges = extractEdgesFromStep(stepKey, step);
    edges.push(...stepEdges);
  }

  return edges;
}
