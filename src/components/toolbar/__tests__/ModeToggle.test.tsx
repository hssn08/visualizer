import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the useTheme hook
const mockSetTheme = vi.fn();
vi.mock('@/components/theme-provider', () => ({
  useTheme: () => ({
    theme: 'light' as const,
    setTheme: mockSetTheme,
  }),
}));

import { ModeToggle } from '../ModeToggle';

describe('ModeToggle', () => {
  it('renders the toggle button with sr-only label', () => {
    render(<ModeToggle />);
    expect(screen.getByText('Toggle theme')).toBeTruthy();
  });

  it('renders Sun and Moon icons', () => {
    const { container } = render(<ModeToggle />);
    // lucide-react renders SVGs with data-testid or we check for SVG elements
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });
});
