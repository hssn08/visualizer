import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store';

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
    });
  });

  it('has nodes array (initially empty)', () => {
    const state = useAppStore.getState();
    expect(state.nodes).toEqual([]);
    expect(Array.isArray(state.nodes)).toBe(true);
  });

  it('has edges array (initially empty)', () => {
    const state = useAppStore.getState();
    expect(state.edges).toEqual([]);
    expect(Array.isArray(state.edges)).toBe(true);
  });

  it('has onNodesChange function', () => {
    const state = useAppStore.getState();
    expect(typeof state.onNodesChange).toBe('function');
  });

  it('has onEdgesChange function', () => {
    const state = useAppStore.getState();
    expect(typeof state.onEdgesChange).toBe('function');
  });

  it('has onConnect function', () => {
    const state = useAppStore.getState();
    expect(typeof state.onConnect).toBe('function');
  });

  it('has selectedNodeId (initially null)', () => {
    const state = useAppStore.getState();
    expect(state.selectedNodeId).toBeNull();
  });

  it('has setSelectedNodeId function that updates selectedNodeId', () => {
    const { setSelectedNodeId } = useAppStore.getState();
    expect(typeof setSelectedNodeId).toBe('function');

    setSelectedNodeId('node-1');
    expect(useAppStore.getState().selectedNodeId).toBe('node-1');

    setSelectedNodeId(null);
    expect(useAppStore.getState().selectedNodeId).toBeNull();
  });

  it('has temporal undo/redo accessible via useAppStore.temporal', () => {
    const temporal = useAppStore.temporal;
    expect(temporal).toBeDefined();

    const temporalState = temporal.getState();
    expect(typeof temporalState.undo).toBe('function');
    expect(typeof temporalState.redo).toBe('function');
  });
});
