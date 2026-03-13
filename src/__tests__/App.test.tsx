import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import App from '@/App';
import { useAppStore } from '@/store';
import sampleFlow from '@/lib/__tests__/fixtures/sampleFlow.json';

beforeAll(() => {
  // jsdom does not implement ResizeObserver which React Flow requires
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('App', () => {
  it('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('wraps content in ReactFlowProvider (React Flow renders without provider error)', () => {
    const { container } = render(<App />);
    // ReactFlow renders a div with class "react-flow" when provider is present
    const reactFlowEl = container.querySelector('.react-flow');
    expect(reactFlowEl).toBeTruthy();
  });

  it('mounts FlowCanvas component', () => {
    const { container } = render(<App />);
    // FlowCanvas renders ReactFlow which creates a .react-flow wrapper
    const reactFlowEl = container.querySelector('.react-flow');
    expect(reactFlowEl).toBeTruthy();
  });

  it('renders ImportButton with "Import" text', () => {
    render(<App />);
    const importButton = screen.getByText('Import');
    expect(importButton).toBeTruthy();
  });

  it('renders full Toolbar with Export button', () => {
    render(<App />);
    expect(screen.getByText('Export')).toBeTruthy();
  });

  it('renders full Toolbar with Layout, Fit, and JSON buttons', () => {
    render(<App />);
    expect(screen.getByText('Layout')).toBeTruthy();
    expect(screen.getByText('Fit')).toBeTruthy();
    expect(screen.getByText('JSON')).toBeTruthy();
  });

  describe('PropertyPanel integration', () => {
    beforeEach(() => {
      useAppStore.setState({
        nodes: [],
        edges: [],
        rawJson: null,
        metadata: null,
        selectedNodeId: null,
        layoutDirection: 'TB',
      });
    });

    it('does not render PropertyPanel when selectedNodeId is null', () => {
      const { container } = render(<App />);
      const panel = container.querySelector('[data-testid="property-panel"]');
      expect(panel).toBeNull();
    });

    it('renders PropertyPanel when a node is selected', () => {
      useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
      useAppStore.getState().setSelectedNodeId('greeting');

      const { container } = render(<App />);
      const panel = container.querySelector('[data-testid="property-panel"]');
      expect(panel).toBeTruthy();
    });
  });

  describe('JsonPreviewPanel integration', () => {
    beforeEach(() => {
      useAppStore.setState({
        nodes: [],
        edges: [],
        rawJson: null,
        metadata: null,
        selectedNodeId: null,
        layoutDirection: 'TB',
        jsonPreviewOpen: false,
      });
    });

    it('does not render JsonPreviewPanel when jsonPreviewOpen is false', () => {
      useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
      // jsonPreviewOpen defaults to false
      const { container } = render(<App />);
      const panel = container.querySelector('[data-testid="json-preview-panel"]');
      expect(panel).toBeNull();
    });

    it('renders JsonPreviewPanel when jsonPreviewOpen is true and metadata exists', () => {
      useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
      useAppStore.setState({ jsonPreviewOpen: true });

      const { container } = render(<App />);
      const panel = container.querySelector('[data-testid="json-preview-panel"]');
      expect(panel).toBeTruthy();
    });
  });

  describe('Collapsible panels', () => {
    beforeEach(() => {
      useAppStore.setState({
        nodes: [],
        edges: [],
        rawJson: null,
        metadata: null,
        selectedNodeId: null,
        layoutDirection: 'TB',
        paletteOpen: true,
        propertyPanelOpen: true,
      });
    });

    it('renders NodePalette when paletteOpen is true (default)', () => {
      render(<App />);
      // NodePalette contains "Add Step" text
      expect(screen.getByText('Add Step')).toBeTruthy();
    });

    it('collapses palette when paletteOpen is toggled to false', () => {
      useAppStore.setState({ paletteOpen: false });
      render(<App />);
      expect(screen.queryByText('Add Step')).toBeNull();
    });

    it('property panel collapses when propertyPanelOpen is toggled to false', () => {
      useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
      useAppStore.getState().setSelectedNodeId('greeting');

      // With propertyPanelOpen = true (default), panel shows
      const { container, rerender } = render(<App />);
      expect(container.querySelector('[data-testid="property-panel"]')).toBeTruthy();

      // Toggle off
      useAppStore.setState({ propertyPanelOpen: false });
      rerender(<App />);
      expect(container.querySelector('[data-testid="property-panel"]')).toBeNull();
    });

    it('property panel requires both selectedNodeId AND propertyPanelOpen', () => {
      useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
      // Has selectedNodeId but propertyPanelOpen is false
      useAppStore.setState({ selectedNodeId: 'greeting', propertyPanelOpen: false });

      const { container } = render(<App />);
      expect(container.querySelector('[data-testid="property-panel"]')).toBeNull();
    });
  });

  describe('Responsive auto-collapse', () => {
    beforeEach(() => {
      useAppStore.setState({
        nodes: [],
        edges: [],
        rawJson: null,
        metadata: null,
        selectedNodeId: null,
        layoutDirection: 'TB',
        paletteOpen: true,
        propertyPanelOpen: true,
      });
    });

    it('collapses palette on narrow viewport (below 768px)', () => {
      // Mock matchMedia to return false for min-width: 768px (narrow viewport)
      const listeners: ((e: MediaQueryListEvent) => void)[] = [];
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        matches: query === '(min-width: 768px)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
          listeners.push(handler);
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList);

      render(<App />);

      // Palette should be auto-collapsed on narrow viewport
      expect(useAppStore.getState().paletteOpen).toBe(false);
    });

    it('does not force panels open when viewport grows above 768px', () => {
      // Start with narrow viewport
      let currentMatches = false;
      const changeListeners: ((e: MediaQueryListEvent) => void)[] = [];
      vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
        matches: query === '(min-width: 768px)' ? currentMatches : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') changeListeners.push(handler);
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList);

      render(<App />);

      // After initial collapse, manually check state
      const stateAfterNarrow = useAppStore.getState();
      expect(stateAfterNarrow.paletteOpen).toBe(false);

      // Simulate viewport growing
      currentMatches = true;
      act(() => {
        for (const handler of changeListeners) {
          handler({ matches: true } as MediaQueryListEvent);
        }
      });

      // Panels should NOT be forced open
      expect(useAppStore.getState().paletteOpen).toBe(false);
    });
  });

  describe('Default flow loading (IMP-03)', () => {
    beforeEach(() => {
      useAppStore.setState({
        nodes: [],
        edges: [],
        rawJson: null,
        metadata: null,
        selectedNodeId: null,
        layoutDirection: 'TB',
        jsonPreviewOpen: false,
      });
      useAppStore.temporal.getState().clear();
    });

    afterEach(() => {
      useAppStore.setState({
        nodes: [],
        edges: [],
        rawJson: null,
        metadata: null,
        selectedNodeId: null,
        layoutDirection: 'TB',
        jsonPreviewOpen: false,
      });
      useAppStore.temporal.getState().clear();
    });

    it('loads default flow on initial render with empty store', () => {
      render(<App />);
      const { nodes } = useAppStore.getState();
      expect(nodes.length).toBeGreaterThan(0);
    });

    it('populates metadata after default flow loads', () => {
      render(<App />);
      const { metadata } = useAppStore.getState();
      expect(metadata).not.toBeNull();
    });

    it('clears temporal undo history after default flow load', () => {
      render(<App />);
      const { pastStates } = useAppStore.temporal.getState();
      expect(pastStates.length).toBe(0);
    });

    it('does NOT reload default flow if metadata already exists', () => {
      // Pre-import so metadata is set
      useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
      const nodesBefore = useAppStore.getState().nodes;

      render(<App />);

      const nodesAfter = useAppStore.getState().nodes;
      // Nodes should remain the same (not re-imported)
      expect(nodesAfter).toBe(nodesBefore);
    });
  });
});
