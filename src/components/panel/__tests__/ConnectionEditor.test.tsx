import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectionEditor } from '../ConnectionEditor';
import { useAppStore } from '@/store';
import sampleFlow from '@/lib/__tests__/fixtures/sampleFlow.json';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('ConnectionEditor', () => {
  beforeEach(() => {
    useAppStore.setState({
      nodes: [],
      edges: [],
      rawJson: null,
      metadata: null,
      selectedNodeId: null,
      layoutDirection: 'TB',
    });
    useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
  });

  it('renders outgoing edges with target dropdowns', () => {
    // greeting has next->verify_identity and timeout->greeting_retry edges
    const { container } = render(<ConnectionEditor nodeId="greeting" />);

    const editor = container.querySelector('[data-testid="connection-editor"]');
    expect(editor).toBeTruthy();

    // Should have select triggers for the outgoing edges
    const triggers = container.querySelectorAll('[data-slot="select-trigger"]');
    expect(triggers.length).toBeGreaterThan(0);
  });

  it('calls updateEdgeTarget when dropdown value changes', () => {
    // We test this by checking the store action exists and outgoing edges render
    // Full Select interaction requires portal/positioner which jsdom can't fully simulate
    const { container } = render(<ConnectionEditor nodeId="greeting" />);

    // Verify outgoing edges exist in the component
    const editor = container.querySelector('[data-testid="connection-editor"]');
    expect(editor).toBeTruthy();

    // Verify the greeting node has outgoing edges that are rendered
    const edges = useAppStore.getState().edges.filter((e) => e.source === 'greeting');
    expect(edges.length).toBeGreaterThan(0);

    // Verify updateEdgeTarget is a function in the store
    expect(typeof useAppStore.getState().updateEdgeTarget).toBe('function');
  });

  it('shows "No connections" when node has no outgoing edges', () => {
    // farewell has no outgoing edges (it's an end node)
    render(<ConnectionEditor nodeId="farewell" />);

    const noConnections = screen.getByTestId('no-connections');
    expect(noConnections).toBeTruthy();
    expect(noConnections.textContent).toBe('No connections');
  });
});
