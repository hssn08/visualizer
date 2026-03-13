import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock window.matchMedia for ThemeProvider and related tests (jsdom lacks it)
// Default: simulate desktop viewport (min-width: 768px matches true)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: query === '(min-width: 768px)',
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
