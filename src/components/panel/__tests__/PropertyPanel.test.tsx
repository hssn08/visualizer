import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyPanel } from '../PropertyPanel';
import { useAppStore } from '@/store';
import sampleFlow from '@/lib/__tests__/fixtures/sampleFlow.json';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('PropertyPanel', () => {
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

  it('renders node title and close button when node is selected', () => {
    render(<PropertyPanel nodeId="greeting" />);

    const title = screen.getByTestId('panel-title');
    expect(title.textContent).toBe('greeting');

    const closeBtn = screen.getByTestId('close-panel');
    expect(closeBtn).toBeTruthy();
  });

  it('renders StructuredFields and ConnectionEditor sections', () => {
    const { container } = render(<PropertyPanel nodeId="greeting" />);

    const structuredFields = container.querySelector('[data-testid="structured-fields"]');
    expect(structuredFields).toBeTruthy();

    // greeting has outgoing edges, so connection-editor should render
    const connectionEditor = container.querySelector('[data-testid="connection-editor"]');
    expect(connectionEditor).toBeTruthy();
  });

  it('returns null when nodeId does not match any node', () => {
    const { container } = render(<PropertyPanel nodeId="nonexistent" />);
    expect(container.innerHTML).toBe('');
  });

  it('closes panel by setting selectedNodeId to null when close button clicked', () => {
    useAppStore.getState().setSelectedNodeId('greeting');

    render(<PropertyPanel nodeId="greeting" />);
    const closeBtn = screen.getByTestId('close-panel');
    fireEvent.click(closeBtn);

    expect(useAppStore.getState().selectedNodeId).toBeNull();
  });
});
