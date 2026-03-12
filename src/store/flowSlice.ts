import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { StateCreator } from 'zustand';
import { jsonToFlow } from '@/lib/jsonToFlow';
import type { AppState, FlowSlice } from './types';

export const createFlowSlice: StateCreator<AppState, [], [], FlowSlice> = (set, get) => ({
  nodes: [],
  edges: [],
  rawJson: null,
  metadata: null,
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge(connection, get().edges) }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  importJson: (raw) => {
    const { nodes, edges, metadata } = jsonToFlow(raw);
    set({ nodes, edges, rawJson: raw, metadata });
  },
});
