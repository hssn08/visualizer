import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';

export interface FlowSlice {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
}

export interface UiSlice {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export type AppState = FlowSlice & UiSlice;
