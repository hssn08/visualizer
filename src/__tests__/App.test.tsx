import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';

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
});
