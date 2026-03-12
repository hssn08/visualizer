import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StructuredFields } from '../StructuredFields';
import { useAppStore } from '@/store';
import sampleFlow from '@/lib/__tests__/fixtures/sampleFlow.json';

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('StructuredFields', () => {
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

  it('renders description and text fields for a step', () => {
    const step = {
      description: 'Initial greeting',
      text: 'Hello, thank you for calling.',
      audio_file: 'greeting.wav',
      wait_for_response: true,
      timeout: 10,
    };

    render(<StructuredFields nodeId="greeting" step={step} />);

    // Description input
    const descInput = screen.getByDisplayValue('Initial greeting');
    expect(descInput).toBeTruthy();

    // Text textarea
    const textArea = screen.getByDisplayValue('Hello, thank you for calling.');
    expect(textArea).toBeTruthy();

    // Audio file input
    const audioInput = screen.getByDisplayValue('greeting.wav');
    expect(audioInput).toBeTruthy();
  });

  it('calls updateNodeData on field change', () => {
    const step = {
      description: 'Initial greeting',
      text: 'Hello.',
    };

    render(<StructuredFields nodeId="greeting" step={step} />);

    const descInput = screen.getByDisplayValue('Initial greeting');
    fireEvent.change(descInput, { target: { value: 'Updated greeting' } });

    // Verify the store was updated
    const node = useAppStore.getState().nodes.find((n) => n.id === 'greeting');
    expect(node).toBeDefined();
    const updatedStep = (node!.data as { step: Record<string, unknown> }).step;
    expect(updatedStep.description).toBe('Updated greeting');
  });

  it('always shows description and text even if absent from step', () => {
    const step = { audio_file: 'test.wav' };

    render(<StructuredFields nodeId="greeting" step={step} />);

    // description and text labels should always be present
    const labels = screen.getAllByText(/^(description|text)$/);
    expect(labels.length).toBeGreaterThanOrEqual(2);
  });

  it('only shows optional fields when present in step data', () => {
    const step = { description: 'test' };

    const { container } = render(<StructuredFields nodeId="greeting" step={step} />);

    // audio_file should NOT be rendered since it's not in step and not in ALWAYS_SHOWN
    const audioInput = container.querySelector('#field-audio_file');
    expect(audioInput).toBeNull();
  });
});
