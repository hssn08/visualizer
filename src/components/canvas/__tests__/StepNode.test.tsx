import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { StepNode, buildOutputHandles } from '../StepNode';
import type { NodeProps, Node } from '@xyflow/react';

// React Flow internals use ResizeObserver and getBoundingClientRect which jsdom lacks.
// Mock ResizeObserver for stable tests.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

type StepNodeData = {
  label: string;
  step: Record<string, unknown>;
  isFirstNode?: boolean;
};
type StepNodeType = Node<StepNodeData, 'step'>;

function renderStepNode(
  overrides: Partial<NodeProps<StepNodeType>> & {
    data?: Partial<StepNodeData>;
    id?: string;
  } = {}
) {
  const defaultData: StepNodeData = {
    label: 'Initial greeting',
    step: {
      description: 'Initial greeting',
      next: 'verify_identity',
      wait_for_response: true,
    },
    isFirstNode: false,
  };

  const props: NodeProps<StepNodeType> = {
    id: overrides.id ?? 'greeting',
    type: 'step',
    data: { ...defaultData, ...overrides.data },
    selected: overrides.selected ?? false,
    isConnectable: true,
    zIndex: 0,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
    dragHandle: undefined,
    parentId: undefined,
    deletable: true,
    selectable: true,
    draggable: true,
    sourcePosition: undefined,
    targetPosition: undefined,
    width: 200,
    height: 120,
    // Provide required measured prop
    measured: { width: 200, height: 120 },
  } as unknown as NodeProps<StepNodeType>;

  return render(
    <ReactFlowProvider>
      <StepNode {...props} />
    </ReactFlowProvider>
  );
}

describe('StepNode', () => {
  it('renders step key (node id) as header text', () => {
    renderStepNode({ id: 'greeting' });
    expect(screen.getByText('greeting')).toBeInTheDocument();
  });

  it('renders step description text', () => {
    renderStepNode({
      data: {
        label: 'Initial greeting',
        step: { description: 'Initial greeting', next: 'step2' },
      },
    });
    expect(screen.getByText('Initial greeting')).toBeInTheDocument();
  });

  it('applies green border class when node is first (start)', () => {
    const { container } = renderStepNode({
      data: {
        label: 'greeting',
        step: { description: 'Initial greeting' },
        isFirstNode: true,
      },
    });
    const nodeDiv = container.querySelector('[data-testid="step-node"]');
    expect(nodeDiv?.className).toContain('border-green-500');
  });

  it('applies red border class when step.action="hangup" (terminal)', () => {
    const { container } = renderStepNode({
      id: 'farewell',
      data: {
        label: 'End call',
        step: { description: 'End call', action: 'hangup' },
        isFirstNode: false,
      },
    });
    const nodeDiv = container.querySelector('[data-testid="step-node"]');
    expect(nodeDiv?.className).toContain('border-red-500');
  });

  it('applies ring/glow class when selected=true', () => {
    const { container } = renderStepNode({ selected: true });
    const nodeDiv = container.querySelector('[data-testid="step-node"]');
    expect(nodeDiv?.className).toContain('ring-2');
    expect(nodeDiv?.className).toContain('ring-ring');
  });

  it('does not apply ring class when selected=false', () => {
    const { container } = renderStepNode({ selected: false });
    const nodeDiv = container.querySelector('[data-testid="step-node"]');
    expect(nodeDiv?.className).not.toContain('ring-2');
  });

  it('renders "wait_for_response" badge when step has that field set to true', () => {
    renderStepNode({
      data: {
        label: 'greeting',
        step: { description: 'Greeting', wait_for_response: true },
      },
    });
    expect(screen.getByText('wait_for_response')).toBeInTheDocument();
  });

  it('does not render "wait_for_response" badge when field is absent', () => {
    renderStepNode({
      data: {
        label: 'greeting',
        step: { description: 'Greeting' },
      },
    });
    expect(screen.queryByText('wait_for_response')).not.toBeInTheDocument();
  });

  it('renders "action" badge when step has an action field', () => {
    renderStepNode({
      data: {
        label: 'farewell',
        step: { description: 'End call', action: 'hangup' },
      },
    });
    expect(screen.getByText('hangup')).toBeInTheDocument();
  });

  it('renders "disposition" badge when step has disposition field', () => {
    renderStepNode({
      data: {
        label: 'farewell',
        step: { description: 'End call', action: 'hangup', disposition: 'completed' },
      },
    });
    expect(screen.getByText('disposition')).toBeInTheDocument();
  });

  it('renders "critical" badge when step has criticalstep field', () => {
    renderStepNode({
      data: {
        label: 'verify',
        step: { description: 'Verify ID', criticalstep: true },
      },
    });
    expect(screen.getByText('critical')).toBeInTheDocument();
  });
});

describe('buildOutputHandles', () => {
  it('returns handle with id="next" when step has a next field', () => {
    const handles = buildOutputHandles({ next: 'verify_identity' });
    expect(handles).toContainEqual(
      expect.objectContaining({ id: 'next', label: 'Next' })
    );
  });

  it('returns handles for conditions (condition-0, condition-1)', () => {
    const step = {
      conditions: [
        { condition: 'verified', condition_description: 'ID verified', next: 'plan_options' },
        { condition: 'not_found', condition_description: 'ID not found', next: 'manual_lookup' },
      ],
    };
    const handles = buildOutputHandles(step);
    expect(handles).toContainEqual(
      expect.objectContaining({ id: 'condition-0', label: 'ID verified' })
    );
    expect(handles).toContainEqual(
      expect.objectContaining({ id: 'condition-1', label: 'ID not found' })
    );
  });

  it('returns handle with id="timeout" when step has timeout_next', () => {
    const handles = buildOutputHandles({ timeout_next: 'greeting_retry' });
    expect(handles).toContainEqual(
      expect.objectContaining({ id: 'timeout', label: 'Timeout' })
    );
  });

  it('returns handle with id="no_match" when step has no_match_next', () => {
    const handles = buildOutputHandles({ no_match_next: 'verify_retry' });
    expect(handles).toContainEqual(
      expect.objectContaining({ id: 'no_match', label: 'No Match' })
    );
  });

  it('returns handles for intent_detector_routes', () => {
    const step = {
      intent_detector_routes: {
        hangup_request: 'farewell',
        speak_to_agent: 'transfer_agent',
      },
    };
    const handles = buildOutputHandles(step);
    expect(handles).toContainEqual(
      expect.objectContaining({ id: 'intent-hangup_request', label: 'hangup_request' })
    );
    expect(handles).toContainEqual(
      expect.objectContaining({ id: 'intent-speak_to_agent', label: 'speak_to_agent' })
    );
  });

  it('returns empty array for step with no connection fields', () => {
    const handles = buildOutputHandles({ description: 'End call' });
    expect(handles).toHaveLength(0);
  });

  it('each handle has a visible label string', () => {
    const step = {
      next: 'step2',
      timeout_next: 'step3',
      no_match_next: 'step4',
    };
    const handles = buildOutputHandles(step);
    for (const handle of handles) {
      expect(typeof handle.label).toBe('string');
      expect(handle.label.length).toBeGreaterThan(0);
    }
  });
});
