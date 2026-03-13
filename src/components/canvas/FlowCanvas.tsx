import { useCallback, useRef } from 'react';
import { ReactFlow, Background, Controls, MiniMap, useReactFlow } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';
import { classifyNodeRole, ROLE_COLORS } from '@/lib/nodeClassify';
import { createNodeFromTemplate, NODE_TEMPLATES } from '@/components/palette/nodeTemplates';
import { getDraggedTemplateType, clearDraggedTemplateType } from '@/components/palette/PaletteItem';
import { useNodeDelete } from '@/hooks/useNodeDelete';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

export function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onEdgesDelete, setSelectedNodeId, addNode } =
    useAppStore(
      useShallow((s) => ({
        nodes: s.nodes,
        edges: s.edges,
        onNodesChange: s.onNodesChange,
        onEdgesChange: s.onEdgesChange,
        onConnect: s.onConnect,
        onEdgesDelete: s.onEdgesDelete,
        setSelectedNodeId: s.setSelectedNodeId,
        addNode: s.addNode,
      }))
    );

  const { screenToFlowPosition } = useReactFlow();
  const { onBeforeDelete, deleteConfirm, confirmDelete, cancelDelete } = useNodeDelete();

  // Drag pause/resume: capture pre-drag state so the entire drag is one undo step
  const preDragSnapshot = useRef<{ nodes: typeof nodes; edges: typeof edges } | null>(null);

  const onNodeDragStart = useCallback(() => {
    preDragSnapshot.current = {
      nodes: useAppStore.getState().nodes,
      edges: useAppStore.getState().edges,
    };
    useAppStore.temporal.getState().pause();
  }, []);

  const onNodeDragStop = useCallback(() => {
    const snapshot = preDragSnapshot.current;
    preDragSnapshot.current = null;
    useAppStore.temporal.getState().resume();

    if (!snapshot) return;

    // Only create an undo entry if state actually changed (handles click-without-drag)
    const currentNodes = useAppStore.getState().nodes;
    const currentEdges = useAppStore.getState().edges;
    if (snapshot.nodes === currentNodes && snapshot.edges === currentEdges) return;

    // Push pre-drag state as a single undo entry
    const { pastStates } = useAppStore.temporal.getState();
    useAppStore.temporal.setState({
      pastStates: [...pastStates, snapshot],
      futureStates: [],
    });
  }, []);

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

  /**
   * Called after React Flow confirms deletion (after onBeforeDelete resolves true).
   * Syncs step data for any deleted edges (including edges connected to deleted nodes).
   */
  const handleDelete = useCallback(
    ({ nodes: deletedNodes, edges: deletedEdges }: { nodes: Node[]; edges: Edge[] }) => {
      if (deletedEdges.length > 0) {
        onEdgesDelete(deletedEdges);
      }
      // Clear selectedNodeId if the selected node was deleted
      for (const node of deletedNodes) {
        const selectedId = useAppStore.getState().selectedNodeId;
        if (selectedId === node.id) {
          setSelectedNodeId(null);
          break;
        }
      }
    },
    [onEdgesDelete, setSelectedNodeId]
  );

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onBeforeDelete={onBeforeDelete}
        onDelete={handleDelete}
        deleteKeyCode={['Backspace', 'Delete']}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
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
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) cancelDelete(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Node?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove &quot;{deleteConfirm?.nodes[0]?.id}&quot; and its connected edges.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
