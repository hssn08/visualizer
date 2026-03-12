/**
 * React Flow nodeTypes registry.
 *
 * IMPORTANT: Defined at module level (not inside a component)
 * to prevent React Flow from re-mounting all nodes on every render.
 * See: https://reactflow.dev/learn/customization/custom-nodes
 */
import type { NodeTypes } from '@xyflow/react';
import { StepNode } from './StepNode';

export const nodeTypes: NodeTypes = {
  step: StepNode,
};
