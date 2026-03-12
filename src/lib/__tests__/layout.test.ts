import { describe, it, expect } from 'vitest';
import { getLayoutedElements, NODE_WIDTH, NODE_HEIGHT } from '@/lib/layout';
import type { Node, Edge } from '@xyflow/react';

/** Helper to create minimal nodes for testing */
function makeNodes(count: number): Node[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `n${i}`,
    type: 'step' as const,
    position: { x: 0, y: 0 },
    data: { label: `Node ${i}` },
  }));
}

/** Helper to create edges between sequential nodes */
function makeChainEdges(nodeCount: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({ id: `e${i}`, source: `n${i}`, target: `n${i + 1}` });
  }
  return edges;
}

describe('getLayoutedElements', () => {
  it('returns nodes with updated x,y positions (not all at 0,0)', () => {
    const nodes = makeNodes(3);
    const edges = makeChainEdges(3);
    const result = getLayoutedElements(nodes, edges);

    // At least one node should have a non-zero position
    const hasNonZero = result.nodes.some(
      (n) => n.position.x !== 0 || n.position.y !== 0
    );
    expect(hasNonZero).toBe(true);
  });

  it('with direction=TB sets targetPosition=top and sourcePosition=bottom on nodes', () => {
    const nodes = makeNodes(3);
    const edges = makeChainEdges(3);
    const result = getLayoutedElements(nodes, edges, 'TB');

    for (const node of result.nodes) {
      expect(node.targetPosition).toBe('top');
      expect(node.sourcePosition).toBe('bottom');
    }
  });

  it('with direction=LR sets targetPosition=left and sourcePosition=right on nodes', () => {
    const nodes = makeNodes(3);
    const edges = makeChainEdges(3);
    const result = getLayoutedElements(nodes, edges, 'LR');

    for (const node of result.nodes) {
      expect(node.targetPosition).toBe('left');
      expect(node.sourcePosition).toBe('right');
    }
  });

  it('returns the same count of nodes as input', () => {
    const nodes = makeNodes(5);
    const edges = makeChainEdges(5);
    const result = getLayoutedElements(nodes, edges);
    expect(result.nodes.length).toBe(nodes.length);
  });

  it('returns edges unchanged (same content)', () => {
    const nodes = makeNodes(3);
    const edges = makeChainEdges(3);
    const result = getLayoutedElements(nodes, edges);

    expect(result.edges).toBe(edges); // same reference
  });

  it('handles empty nodes array without error', () => {
    const result = getLayoutedElements([], []);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });

  it('handles single node without error', () => {
    const nodes = makeNodes(1);
    const result = getLayoutedElements(nodes, []);
    expect(result.nodes.length).toBe(1);
  });

  it('handles nodes with no edges (disconnected graph) without error', () => {
    const nodes = makeNodes(4);
    const result = getLayoutedElements(nodes, []);
    expect(result.nodes.length).toBe(4);
    // All nodes should have positions (dagre will still place them)
    for (const node of result.nodes) {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    }
  });

  it('node positions are offset by half NODE_WIDTH/NODE_HEIGHT from dagre center', () => {
    // Dagre places a single node at its center (NODE_WIDTH/2, NODE_HEIGHT/2).
    // Our function subtracts half dimensions to get the top-left corner,
    // so the result should be (0, 0).
    const nodes = makeNodes(1);
    const result = getLayoutedElements(nodes, []);
    const node = result.nodes[0];

    expect(node.position.x).toBe(0);
    expect(node.position.y).toBe(0);
  });

  it('defaults to TB direction when none specified', () => {
    const nodes = makeNodes(2);
    const edges = makeChainEdges(2);
    const result = getLayoutedElements(nodes, edges);

    for (const node of result.nodes) {
      expect(node.targetPosition).toBe('top');
      expect(node.sourcePosition).toBe('bottom');
    }
  });
});
