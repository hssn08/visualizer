import { useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';
import { classifyNodeRole, ROLE_COLORS } from '@/lib/nodeClassify';
import { createNodeFromTemplate, NODE_TEMPLATES } from '@/components/palette/nodeTemplates';
import { getDraggedTemplateType, clearDraggedTemplateType } from '@/components/palette/PaletteItem';

export function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setSelectedNodeId, addNode } =
    useAppStore(
      useShallow((s) => ({
        nodes: s.nodes,
        edges: s.edges,
        onNodesChange: s.onNodesChange,
        onEdgesChange: s.onEdgesChange,
        onConnect: s.onConnect,
        setSelectedNodeId: s.setSelectedNodeId,
        addNode: s.addNode,
      }))
    );

  const { screenToFlowPosition } = useReactFlow();

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

  /**
   * Handle pointer-event DnD drop from palette.
   * Reads the dragged template type set by PaletteItem.onPointerDown,
   * converts screen coords to flow coords via screenToFlowPosition,
   * creates a new node and adds it to the store.
   */
  const onPointerUp = useCallback(
    (event: React.PointerEvent) => {
      const templateType = getDraggedTemplateType();
      if (!templateType) return;
      clearDraggedTemplateType();

      const template = NODE_TEMPLATES.find((t) => t.type === templateType);
      if (!template) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const existingIds = new Set(nodes.map((n) => n.id));
      const newNode = createNodeFromTemplate(template, position, existingIds);
      addNode(newNode);
    },
    [screenToFlowPosition, nodes, addNode]
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
      onPointerUp={onPointerUp}
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
