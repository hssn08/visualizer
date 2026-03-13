import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonPreviewPanel } from '../JsonPreviewPanel';
import { useAppStore } from '@/store';
import sampleFlow from '@/lib/__tests__/fixtures/sampleFlow.json';

beforeEach(() => {
  useAppStore.setState({
    nodes: [],
    edges: [],
    rawJson: null,
    metadata: null,
    selectedNodeId: null,
    layoutDirection: 'TB' as const,
    jsonPreviewOpen: false,
  });
});

describe('JsonPreviewPanel', () => {
  it('renders formatted JSON when metadata and nodes exist in store', () => {
    useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
    const { container } = render(<JsonPreviewPanel />);
    const panel = container.querySelector('[data-testid="json-preview-panel"]');
    expect(panel).toBeTruthy();

    // The pre element should contain formatted JSON
    const pre = panel!.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre!.textContent).toContain('Medicare Enrollment');
  });

  it('returns null when metadata is null', () => {
    const { container } = render(<JsonPreviewPanel />);
    const panel = container.querySelector('[data-testid="json-preview-panel"]');
    expect(panel).toBeNull();
  });

  it('shows a header with "JSON Preview" text and a close button', () => {
    useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
    render(<JsonPreviewPanel />);

    expect(screen.getByText('JSON Preview')).toBeTruthy();

    // Close button should exist (aria-label or by role)
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeTruthy();
  });

  it('clicking close button calls toggleJsonPreview', () => {
    useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
    // Set jsonPreviewOpen to true so we can verify toggle sets it to false
    useAppStore.setState({ jsonPreviewOpen: true });

    render(<JsonPreviewPanel />);
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(useAppStore.getState().jsonPreviewOpen).toBe(false);
  });

  it('rendered JSON contains flow_name and steps from the imported flow', () => {
    useAppStore.getState().importJson(sampleFlow as Record<string, unknown>);
    const { container } = render(<JsonPreviewPanel />);

    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
    const text = pre!.textContent!;

    // flow_name should be in the JSON output
    expect(text).toContain('Medicare Enrollment');
    // Steps should be present
    expect(text).toContain('greeting');
    expect(text).toContain('verify_identity');
    expect(text).toContain('farewell');
  });
});
