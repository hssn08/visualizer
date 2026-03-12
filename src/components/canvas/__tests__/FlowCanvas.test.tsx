import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { FlowCanvas } from '../FlowCanvas';

// React Flow internals use ResizeObserver and IntersectionObserver which jsdom lacks.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

vi.stubGlobal(
  'IntersectionObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

// Mock DOMMatrixReadOnly which React Flow uses for transforms
vi.stubGlobal(
  'DOMMatrixReadOnly',
  class {
    m22 = 1;
    constructor() {}
  }
);

describe('FlowCanvas', () => {
  it('renders without crashing (smoke test)', () => {
    const { container } = render(
      <ReactFlowProvider>
        <FlowCanvas />
      </ReactFlowProvider>
    );
    // ReactFlow renders a wrapper div with class 'react-flow'
    const rfWrapper = container.querySelector('.react-flow');
    expect(rfWrapper).toBeTruthy();
  });
});
