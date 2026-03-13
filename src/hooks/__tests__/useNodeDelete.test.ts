import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNodeDelete } from '../useNodeDelete';
import type { Node, Edge } from '@xyflow/react';

const mockNode: Node = {
  id: 'step_a',
  type: 'step',
  position: { x: 0, y: 0 },
  data: { label: 'Step A', step: { description: 'test' } },
};

const mockEdge: Edge = {
  id: 'step_a->next->step_b',
  source: 'step_a',
  target: 'step_b',
  type: 'conditional',
  data: { edgeType: 'next' },
};

describe('useNodeDelete', () => {
  it('onBeforeDelete resolves to false when cancelDelete is called (cancel path)', async () => {
    const { result } = renderHook(() => useNodeDelete());

    let promise: Promise<boolean>;
    act(() => {
      promise = result.current.onBeforeDelete({ nodes: [mockNode], edges: [] });
    });

    // deleteConfirm should be set
    expect(result.current.deleteConfirm).not.toBeNull();

    act(() => {
      result.current.cancelDelete();
    });

    const resolved = await promise!;
    expect(resolved).toBe(false);
  });

  it('onBeforeDelete resolves to true when confirmDelete is called (confirm path)', async () => {
    const { result } = renderHook(() => useNodeDelete());

    let promise: Promise<boolean>;
    act(() => {
      promise = result.current.onBeforeDelete({ nodes: [mockNode], edges: [] });
    });

    act(() => {
      result.current.confirmDelete();
    });

    const resolved = await promise!;
    expect(resolved).toBe(true);
  });

  it('onBeforeDelete resolves true immediately for edge-only deletion (no dialog)', async () => {
    const { result } = renderHook(() => useNodeDelete());

    let resolved: boolean;
    await act(async () => {
      resolved = await result.current.onBeforeDelete({ nodes: [], edges: [mockEdge] });
    });

    expect(resolved!).toBe(true);
    expect(result.current.deleteConfirm).toBeNull();
  });

  it('sets deleteConfirm state with nodes, edges, and resolve when onBeforeDelete called with nodes', () => {
    const { result } = renderHook(() => useNodeDelete());

    act(() => {
      result.current.onBeforeDelete({ nodes: [mockNode], edges: [mockEdge] });
    });

    expect(result.current.deleteConfirm).not.toBeNull();
    expect(result.current.deleteConfirm!.nodes).toEqual([mockNode]);
    expect(result.current.deleteConfirm!.edges).toEqual([mockEdge]);
    expect(typeof result.current.deleteConfirm!.resolve).toBe('function');
  });

  it('clears deleteConfirm to null after confirmDelete', async () => {
    const { result } = renderHook(() => useNodeDelete());

    act(() => {
      result.current.onBeforeDelete({ nodes: [mockNode], edges: [] });
    });
    expect(result.current.deleteConfirm).not.toBeNull();

    act(() => {
      result.current.confirmDelete();
    });
    expect(result.current.deleteConfirm).toBeNull();
  });

  it('clears deleteConfirm to null after cancelDelete', async () => {
    const { result } = renderHook(() => useNodeDelete());

    act(() => {
      result.current.onBeforeDelete({ nodes: [mockNode], edges: [] });
    });
    expect(result.current.deleteConfirm).not.toBeNull();

    act(() => {
      result.current.cancelDelete();
    });
    expect(result.current.deleteConfirm).toBeNull();
  });
});
