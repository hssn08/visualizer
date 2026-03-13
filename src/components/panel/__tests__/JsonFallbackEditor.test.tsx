import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useAppStore } from '@/store';
import sampleFlow from '@/lib/__tests__/fixtures/sampleFlow.json';
import { ThemeProvider } from '@/components/theme-provider';

// Mock json-edit-react since it has complex internal rendering not suitable for jsdom
vi.mock('json-edit-react', () => ({
  JsonEditor: ({
    data,
    setData,
    rootName,
    theme,
  }: {
    data: unknown;
    setData?: (data: unknown) => void;
    rootName?: string;
    theme?: unknown;
  }) => (
    <div data-testid="mock-json-editor">
      <span data-testid="mock-root-name">{rootName}</span>
      <span data-testid="mock-data">{JSON.stringify(data)}</span>
      <span data-testid="mock-theme">{JSON.stringify(theme)}</span>
      <button
        data-testid="mock-set-data"
        onClick={() =>
          setData?.({ description: 'Updated via JSON editor', text: 'new text' })
        }
      >
        Trigger setData
      </button>
    </div>
  ),
  githubDarkTheme: { name: 'githubDark' },
  githubLightTheme: { name: 'githubLight' },
}));

// Import after mock setup
import { JsonFallbackEditor } from '../JsonFallbackEditor';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('JsonFallbackEditor', () => {
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

  it('renders the JSON editor with step data', () => {
    const node = useAppStore
      .getState()
      .nodes.find((n) => n.id === 'greeting');
    const step = (node!.data as { step: Record<string, unknown> }).step;

    render(
      <ThemeProvider defaultTheme="light">
        <JsonFallbackEditor nodeId="greeting" step={step} />
      </ThemeProvider>
    );

    const mockEditor = screen.getByTestId('mock-json-editor');
    expect(mockEditor).toBeTruthy();

    const rootName = screen.getByTestId('mock-root-name');
    expect(rootName.textContent).toBe('greeting');

    const dataEl = screen.getByTestId('mock-data');
    const parsedData = JSON.parse(dataEl.textContent!);
    expect(parsedData.description).toBe('Initial greeting');
  });

  it('calls updateNodeData when setData is triggered', () => {
    const node = useAppStore
      .getState()
      .nodes.find((n) => n.id === 'greeting');
    const step = (node!.data as { step: Record<string, unknown> }).step;

    render(
      <ThemeProvider defaultTheme="light">
        <JsonFallbackEditor nodeId="greeting" step={step} />
      </ThemeProvider>
    );

    const triggerBtn = screen.getByTestId('mock-set-data');
    fireEvent.click(triggerBtn);

    // Verify store was updated
    const updatedNode = useAppStore
      .getState()
      .nodes.find((n) => n.id === 'greeting');
    const updatedStep = (updatedNode!.data as { step: Record<string, unknown> })
      .step;
    expect(updatedStep.description).toBe('Updated via JSON editor');
    expect(updatedStep.text).toBe('new text');
  });

  it('passes githubLightTheme when theme is light', () => {
    const node = useAppStore
      .getState()
      .nodes.find((n) => n.id === 'greeting');
    const step = (node!.data as { step: Record<string, unknown> }).step;

    render(
      <ThemeProvider defaultTheme="light">
        <JsonFallbackEditor nodeId="greeting" step={step} />
      </ThemeProvider>
    );

    const themeEl = screen.getByTestId('mock-theme');
    const parsedTheme = JSON.parse(themeEl.textContent!);
    expect(parsedTheme.name).toBe('githubLight');
  });

  it('passes githubDarkTheme when theme is dark', () => {
    const node = useAppStore
      .getState()
      .nodes.find((n) => n.id === 'greeting');
    const step = (node!.data as { step: Record<string, unknown> }).step;

    render(
      <ThemeProvider defaultTheme="dark">
        <JsonFallbackEditor nodeId="greeting" step={step} />
      </ThemeProvider>
    );

    const themeEl = screen.getByTestId('mock-theme');
    const parsedTheme = JSON.parse(themeEl.textContent!);
    expect(parsedTheme.name).toBe('githubDark');
  });
});
