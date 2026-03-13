import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../ExportButton';
import { useAppStore } from '@/store';
import sampleFlow from '@/lib/__tests__/fixtures/sampleFlow.json';

// Capture anchor element for export assertions
let capturedAnchor: HTMLAnchorElement | null = null;
let originalCreateObjectURL: typeof URL.createObjectURL;
let originalRevokeObjectURL: typeof URL.revokeObjectURL;

beforeEach(() => {
  // Reset store
  useAppStore.setState({
    nodes: [],
    edges: [],
    rawJson: null,
    metadata: null,
    selectedNodeId: null,
    layoutDirection: 'TB' as const,
    jsonPreviewOpen: false,
  });

  capturedAnchor = null;

  // Mock URL.createObjectURL and revokeObjectURL without replacing global URL
  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

/**
 * Spy on document.createElement to capture the anchor element created during export.
 * Must be called AFTER render (to avoid interfering with React rendering).
 * Also mocks body.appendChild/removeChild since we don't want real DOM manipulation.
 */
function spyOnAnchorCreation() {
  const origCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = origCreate(tag);
    if (tag === 'a') {
      el.click = vi.fn();
      capturedAnchor = el;
    }
    return el;
  });
  vi.spyOn(document.body, 'appendChild').mockImplementation((child) => child);
  vi.spyOn(document.body, 'removeChild').mockImplementation((child) => child);
}

describe('ExportButton', () => {
  it('renders and is disabled when metadata is null', () => {
    render(<ExportButton />);
    const button = screen.getByText('Export').closest('button');
    expect(button).toBeTruthy();
    expect(button!.hasAttribute('disabled')).toBe(true);
  });

  it('is enabled when metadata exists (store has imported flow)', () => {
    useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
    render(<ExportButton />);
    const button = screen.getByText('Export').closest('button');
    expect(button).toBeTruthy();
    expect(button!.hasAttribute('disabled')).toBe(false);
  });

  it('handleExport creates Blob with correct JSON content type', () => {
    useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
    render(<ExportButton />);
    spyOnAnchorCreation();

    const button = screen.getByText('Export').closest('button')!;
    fireEvent.click(button);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Blob;
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe('application/json');
  });

  it('handleExport uses sanitized flow_name for filename', () => {
    // sampleFlow has flow_name: "Medicare Enrollment"
    useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
    render(<ExportButton />);
    spyOnAnchorCreation();

    const button = screen.getByText('Export').closest('button')!;
    fireEvent.click(button);

    // "Medicare Enrollment" -> "medicare_enrollment.json"
    expect(capturedAnchor).toBeTruthy();
    expect(capturedAnchor!.download).toBe('medicare_enrollment.json');
  });

  it('handleExport falls back to "flow.json" when flow_name is absent', () => {
    // Create a flow without flow_name
    const noNameFlow = { ...sampleFlow } as Record<string, unknown>;
    delete noNameFlow.flow_name;
    useAppStore.getState().importJson(noNameFlow);
    render(<ExportButton />);
    spyOnAnchorCreation();

    const button = screen.getByText('Export').closest('button')!;
    fireEvent.click(button);

    expect(capturedAnchor).toBeTruthy();
    expect(capturedAnchor!.download).toBe('flow.json');
  });

  it('handleExport calls URL.revokeObjectURL to prevent memory leak', () => {
    useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
    render(<ExportButton />);
    spyOnAnchorCreation();

    const button = screen.getByText('Export').closest('button')!;
    fireEvent.click(button);

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
