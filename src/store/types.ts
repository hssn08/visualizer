import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import type { JsonMetadata } from '@/lib/types';

export interface FlowSlice {
  nodes: Node[];
  edges: Edge[];
  rawJson: Record<string, unknown> | null;
  metadata: JsonMetadata | null;
  layoutDirection: 'TB' | 'LR';
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  importJson: (raw: Record<string, unknown>) => void;
  setLayoutDirection: (dir: 'TB' | 'LR') => void;
  autoLayout: () => void;
}

export interface UiSlice {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export type AppState = FlowSlice & UiSlice;
