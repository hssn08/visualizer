import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { StateCreator } from 'zustand';
import { jsonToFlow } from '@/lib/jsonToFlow';
import { getLayoutedElements } from '@/lib/layout';
import { deriveEdgeType, syncEdgeCreateToStep, syncEdgeDeleteToStep } from '@/lib/edgeSync';
import type { AppState, FlowSlice } from './types';

export const createFlowSlice: StateCreator<AppState, [], [], FlowSlice> = (set, get) => ({
  nodes: [],
  edges: [],
  rawJson: null,
  metadata: null,
  layoutDirection: 'TB',
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    if (!source || !target) return;
    const handleId = sourceHandle || 'next';
    const newEdge = {
      id: `${source}->${handleId}->${target}`,
      source,
      target,
      sourceHandle: handleId,
      targetHandle: targetHandle || 'target',
      type: 'conditional' as const,
      data: { edgeType: deriveEdgeType(sourceHandle ?? null) },
    };
    set({ edges: [...get().edges, newEdge] });
    // Sync the connection field to source node step data
    const patch = syncEdgeCreateToStep(sourceHandle ?? null, target);
    if (Object.keys(patch).length > 0) {
      get().updateNodeData(source, patch);
    }
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  importJson: (raw) => {
    const { nodes, edges, metadata } = jsonToFlow(raw);
    const { nodes: layouted } = getLayoutedElements(nodes, edges, get().layoutDirection);
    set({ nodes: layouted, edges, rawJson: raw, metadata });
  },
  setLayoutDirection: (dir) => set({ layoutDirection: dir }),
  autoLayout: () => {
    const { nodes, edges, layoutDirection } = get();
    const { nodes: layouted } = getLayoutedElements(nodes, edges, layoutDirection);
    set({ nodes: layouted });
  },
  updateNodeData: (nodeId, patch) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id !== nodeId) return node;
        const step = (node.data as { step: Record<string, unknown> }).step;
        return {
          ...node,
          data: {
            ...node.data,
            step: { ...step, ...patch },
          },
        };
      }),
    });
  },
  updateEdgeTarget: (edgeId, newTarget) => {
    set({
      edges: get().edges.map((edge) => {
        if (edge.id !== edgeId) return edge;
        return {
          ...edge,
          target: newTarget,
          id: edge.id.replace(/->([^>]+)$/, '->' + newTarget),
        };
      }),
    });
  },
  onEdgesDelete: (deletedEdges) => {
    for (const edge of deletedEdges) {
      const patch = syncEdgeDeleteToStep(edge);
      if (Object.keys(patch).length > 0) {
        get().updateNodeData(edge.source, patch);
      }
    }
  },
  addNode: (node) => set({ nodes: [...get().nodes, node] }),
});
