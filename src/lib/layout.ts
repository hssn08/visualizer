import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

/** Default node dimensions for dagre layout calculations. */
export const NODE_WIDTH = 250;
export const NODE_HEIGHT = 150;

/**
 * Apply dagre auto-layout to React Flow nodes and edges.
 *
 * Positions nodes in a readable tree/DAG layout using the dagre library.
 * Nodes are placed at their top-left corner (dagre returns center positions,
 * so we offset by half width/height).
 *
 * @param nodes - React Flow nodes to layout
 * @param edges - React Flow edges defining the graph structure
 * @param direction - 'TB' (top-to-bottom) or 'LR' (left-to-right)
 * @returns New nodes array with updated positions and same edges reference
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  if (nodes.length === 0) {
    return { nodes: [], edges };
  }

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const isHorizontal = direction === 'LR';

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);

    return {
      ...node,
      targetPosition: (isHorizontal ? 'left' : 'top') as Node['targetPosition'],
      sourcePosition: (isHorizontal ? 'right' : 'bottom') as Node['sourcePosition'],
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
