import { useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';
import { classifyNodeRole, ROLE_COLORS } from '@/lib/nodeClassify';

export function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId } =
    useAppStore(
      useShallow((s) => ({
        nodes: s.nodes,
        edges: s.edges,
        onNodesChange: s.onNodesChange,
        onEdgesChange: s.onEdgesChange,
        onConnect: s.onConnect,
        setSelectedNodeId: s.setSelectedNodeId,
      }))
    );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const miniMapNodeColor = useCallback(
    (node: Node) => {
      const step = (node.data as { step: Record<string, unknown> }).step;
      const isFirst = nodes.length > 0 && node.id === nodes[0].id;
      const role = classifyNodeRole(node.id, step, isFirst);
      return ROLE_COLORS[role].minimap;
    },
    [nodes]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap nodeColor={miniMapNodeColor} pannable zoomable />
    </ReactFlow>
  );
}
