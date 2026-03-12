import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { StateCreator } from 'zustand';
import type { AppState, FlowSlice } from './types';

export const createFlowSlice: StateCreator<AppState, [], [], FlowSlice> = (set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge(connection, get().edges) }),
});
