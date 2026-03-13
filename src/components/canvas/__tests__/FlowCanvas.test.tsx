import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';
import { ThemeProvider } from '@/components/theme-provider';
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
      <ThemeProvider defaultTheme="light">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </ThemeProvider>
    );
    // ReactFlow renders a wrapper div with class 'react-flow'
    const rfWrapper = container.querySelector('.react-flow');
    expect(rfWrapper).toBeTruthy();
  });

  it('passes colorMode="light" to ReactFlow when theme is light', () => {
    const { container } = render(
      <ThemeProvider defaultTheme="light">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </ThemeProvider>
    );
    // React Flow adds a class based on colorMode: 'light' or 'dark'
    const rfWrapper = container.querySelector('.react-flow');
    expect(rfWrapper).toBeTruthy();
    expect(rfWrapper!.classList.contains('light')).toBe(true);
  });

  it('passes colorMode="dark" to ReactFlow when theme is dark', () => {
    const { container } = render(
      <ThemeProvider defaultTheme="dark">
        <ReactFlowProvider>
          <FlowCanvas />
        </ReactFlowProvider>
      </ThemeProvider>
    );
    const rfWrapper = container.querySelector('.react-flow');
    expect(rfWrapper).toBeTruthy();
    expect(rfWrapper!.classList.contains('dark')).toBe(true);
  });
});
