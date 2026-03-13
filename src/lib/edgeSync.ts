import type { Edge } from '@xyflow/react';

/**
 * Derive the semantic edge type from a React Flow source handle ID.
 *
 * Handle IDs follow the convention set by StepNode:
 * - 'next' | null -> 'next'
 * - 'timeout' -> 'timeout'
 * - 'no_match' -> 'no_match'
 * - 'condition-{i}' -> 'condition'
 * - 'intent-{name}' -> 'intent'
 */
export function deriveEdgeType(sourceHandle: string | null): string {
  if (!sourceHandle || sourceHandle === 'next') return 'next';
  if (sourceHandle === 'timeout') return 'timeout';
  if (sourceHandle === 'no_match') return 'no_match';
  if (sourceHandle.startsWith('condition-')) return 'condition';
  if (sourceHandle.startsWith('intent-')) return 'intent';
  return 'next'; // fallback
}

/**
 * Build a step-data patch when an edge is created (drawn by user).
 *
 * Maps sourceHandle to the connection field that should be set on
 * the source node's step data. For basic types (next, timeout, no_match),
 * the target step key is stored directly. Condition and intent edges are
 * primarily created via import, so they return an empty patch for now.
 */
export function syncEdgeCreateToStep(
  sourceHandle: string | null,
  target: string,
): Record<string, unknown> {
  const edgeType = deriveEdgeType(sourceHandle);
  switch (edgeType) {
    case 'next':
      return { next: target };
    case 'timeout':
      return { timeout_next: target };
    case 'no_match':
      return { no_match_next: target };
    default:
      return {};
  }
}

/**
 * Build a step-data patch when an edge is deleted.
 *
 * Clears the connection field on the source node's step data that
 * corresponds to the deleted edge's type. Setting to undefined causes
 * the field to be removed by the store's shallow merge.
 */
export function syncEdgeDeleteToStep(
  edge: Pick<Edge, 'id' | 'source' | 'target' | 'data'>,
): Record<string, unknown> {
  const edgeType = edge.data?.edgeType as string | undefined;
  switch (edgeType) {
    case 'next':
      return { next: undefined };
    case 'timeout':
      return { timeout_next: undefined };
    case 'no_match':
      return { no_match_next: undefined };
    default:
      return {};
  }
}
