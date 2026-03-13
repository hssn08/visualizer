import { useState, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';

export interface DeleteConfirmState {
  nodes: Node[];
  edges: Edge[];
  resolve: (value: boolean) => void;
}

/**
 * Hook encapsulating the onBeforeDelete Promise pattern for node deletion
 * confirmation. When React Flow's onBeforeDelete fires with nodes to delete,
 * a Promise is created and the dialog state is set. The AlertDialog then
 * shows, and the user confirms or cancels -- resolving the Promise.
 *
 * Edge-only deletions (nodes.length === 0) bypass the dialog and resolve
 * immediately to true.
 */
export function useNodeDelete() {
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);

  const onBeforeDelete = useCallback(
    ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }): Promise<boolean> => {
      // Edge-only deletion: no confirmation needed
      if (nodes.length === 0) {
        return Promise.resolve(true);
      }

      return new Promise<boolean>((resolve) => {
        setDeleteConfirm({ nodes, edges, resolve });
      });
    },
    [],
  );

  const confirmDelete = useCallback(() => {
    if (deleteConfirm) {
      deleteConfirm.resolve(true);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm]);

  const cancelDelete = useCallback(() => {
    if (deleteConfirm) {
      deleteConfirm.resolve(false);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm]);

  return {
    onBeforeDelete,
    deleteConfirm,
    confirmDelete,
    cancelDelete,
  };
}
