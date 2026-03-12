import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { Toolbar } from '../Toolbar';
import { useAppStore } from '@/store';

// Mock useReactFlow since we're outside a real React Flow context
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual<typeof import('@xyflow/react')>(
    '@xyflow/react'
  );
  return {
    ...actual,
    useReactFlow: () => ({
      fitView: vi.fn(),
    }),
  };
});

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

beforeEach(() => {
  // Reset store to initial state before each test
  useAppStore.setState({
    nodes: [],
    edges: [],
    rawJson: null,
    metadata: null,
    layoutDirection: 'TB' as const,
    selectedNodeId: null,
    jsonPreviewOpen: false,
  });
});

function renderToolbar() {
  return render(
    <ReactFlowProvider>
      <Toolbar />
    </ReactFlowProvider>
  );
}

describe('Toolbar', () => {
  it('renders all expected buttons', () => {
    renderToolbar();
    expect(screen.getByText('Import')).toBeTruthy();
    expect(screen.getByText('Export')).toBeTruthy();
    expect(screen.getByText('Layout')).toBeTruthy();
    expect(screen.getByText('TB')).toBeTruthy();
    expect(screen.getByText('Fit')).toBeTruthy();
    expect(screen.getByText('JSON')).toBeTruthy();
  });

  it('Export button is disabled when no metadata is loaded', () => {
    renderToolbar();
    const exportButton = screen.getByText('Export').closest('button');
    expect(exportButton).toBeTruthy();
    expect(exportButton!.hasAttribute('disabled')).toBe(true);
  });

  it('JSON Preview button is disabled when no metadata is loaded', () => {
    renderToolbar();
    const jsonButton = screen.getByText('JSON').closest('button');
    expect(jsonButton).toBeTruthy();
    expect(jsonButton!.hasAttribute('disabled')).toBe(true);
  });

  it('Direction button shows current layoutDirection from store', () => {
    renderToolbar();
    expect(screen.getByText('TB')).toBeTruthy();

    // Change direction in store
    useAppStore.setState({ layoutDirection: 'LR' as const });
    renderToolbar();
    expect(screen.getByText('LR')).toBeTruthy();
  });

  it('jsonPreviewOpen toggles via toggleJsonPreview', () => {
    expect(useAppStore.getState().jsonPreviewOpen).toBe(false);
    useAppStore.getState().toggleJsonPreview();
    expect(useAppStore.getState().jsonPreviewOpen).toBe(true);
    useAppStore.getState().toggleJsonPreview();
    expect(useAppStore.getState().jsonPreviewOpen).toBe(false);
  });
});
