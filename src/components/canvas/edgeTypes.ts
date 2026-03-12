import type { EdgeTypes } from '@xyflow/react';
import { ConditionalEdge } from './ConditionalEdge';

/**
 * Module-level edge type registry for React Flow.
 * Defined outside components to avoid recreating on every render.
 */
export const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
};
