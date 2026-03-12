import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store';
import sampleFlow from '@/lib/__tests__/fixtures/sampleFlow.json';

describe('Zustand Store', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      nodes: [],
      edges: [],
      rawJson: null,
      metadata: null,
      selectedNodeId: null,
      layoutDirection: 'TB',
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

  it('has rawJson initially null', () => {
    const state = useAppStore.getState();
    expect(state.rawJson).toBeNull();
  });

  it('has metadata initially null', () => {
    const state = useAppStore.getState();
    expect(state.metadata).toBeNull();
  });

  it('setNodes replaces the nodes array', () => {
    const { setNodes } = useAppStore.getState();
    const newNodes = [
      { id: 'n1', type: 'default' as const, position: { x: 0, y: 0 }, data: { label: 'N1' } },
    ];
    setNodes(newNodes);
    expect(useAppStore.getState().nodes).toEqual(newNodes);
  });

  it('setEdges replaces the edges array', () => {
    const { setEdges } = useAppStore.getState();
    const newEdges = [
      { id: 'e1', source: 'a', target: 'b' },
    ];
    setEdges(newEdges);
    expect(useAppStore.getState().edges).toEqual(newEdges);
  });

  it('importJson sets nodes, edges, rawJson, and metadata from sample JSON', () => {
    const { importJson } = useAppStore.getState();
    importJson(sampleFlow as Record<string, unknown>);

    const state = useAppStore.getState();
    expect(state.nodes.length).toBeGreaterThan(0);
    expect(state.edges.length).toBeGreaterThan(0);
    expect(state.rawJson).toEqual(sampleFlow);
    expect(state.metadata).not.toBeNull();
    expect(state.metadata!.stepsKey).toBe('steps');
    expect(state.metadata!.wrapperFields).toHaveProperty('flow_name', 'Medicare Enrollment');
  });

  it('has layoutDirection initially set to TB', () => {
    const state = useAppStore.getState();
    expect(state.layoutDirection).toBe('TB');
  });

  it('setLayoutDirection changes the direction', () => {
    const { setLayoutDirection } = useAppStore.getState();
    setLayoutDirection('LR');
    expect(useAppStore.getState().layoutDirection).toBe('LR');

    setLayoutDirection('TB');
    expect(useAppStore.getState().layoutDirection).toBe('TB');
  });

  it('autoLayout repositions nodes using dagre', () => {
    const { importJson } = useAppStore.getState();
    importJson(sampleFlow as Record<string, unknown>);

    // Record positions after import
    const positionsAfterImport = useAppStore.getState().nodes.map((n) => ({ ...n.position }));

    // Manually set all nodes to (0,0) to verify autoLayout changes them
    const resetNodes = useAppStore.getState().nodes.map((n) => ({
      ...n,
      position: { x: 0, y: 0 },
    }));
    useAppStore.getState().setNodes(resetNodes);

    // Now auto layout should reposition them
    useAppStore.getState().autoLayout();
    const positionsAfterAutoLayout = useAppStore.getState().nodes.map((n) => ({ ...n.position }));

    // Positions should match import positions (both use dagre with same direction)
    expect(positionsAfterAutoLayout).toEqual(positionsAfterImport);
  });

  it('importJson applies dagre layout (positions are not grid positions)', () => {
    const { importJson } = useAppStore.getState();
    importJson(sampleFlow as Record<string, unknown>);

    const state = useAppStore.getState();
    // The old grid layout used x = (i % 4) * 300, y = Math.floor(i / 4) * 200
    // Dagre positions should differ from that pattern.
    // With dagre, not all nodes will be at y=0 (tree layout adds vertical spacing)
    const uniqueYs = new Set(state.nodes.map((n) => n.position.y));
    // With 9 nodes in a tree, there should be multiple unique Y values
    expect(uniqueYs.size).toBeGreaterThan(1);
  });
});
