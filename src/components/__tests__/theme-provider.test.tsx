import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../theme-provider';

function TestConsumer() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Dark
      </button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Light
      </button>
      <button data-testid="set-system" onClick={() => setTheme('system')}>
        System
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
  });

  it('defaults to system theme when no localStorage value', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );
    expect(screen.getByTestId('current-theme').textContent).toBe('system');
  });

  it('persists theme to localStorage when setTheme is called', () => {
    render(
      <ThemeProvider storageKey="vite-ui-theme">
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId('set-dark').click();
    });

    expect(localStorage.getItem('vite-ui-theme')).toBe('dark');
  });

  it('reads initial theme from localStorage', () => {
    localStorage.setItem('vite-ui-theme', 'dark');

    render(
      <ThemeProvider storageKey="vite-ui-theme">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme').textContent).toBe('dark');
  });

  it('applies dark class to documentElement when theme is dark', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId('set-dark').click();
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('applies light class to documentElement when theme is light', () => {
    render(
      <ThemeProvider>
        <TestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId('set-light').click();
    });

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('resolves system theme via matchMedia', () => {
    // matchMedia mock returns matches: false by default (light)
    render(
      <ThemeProvider defaultTheme="system">
        <TestConsumer />
      </ThemeProvider>
    );

    // System should resolve to light (since matchMedia mock returns matches: false)
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('resolves system to dark when matchMedia prefers dark', () => {
    // Override matchMedia to return matches: true (dark preference)
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList
    );

    render(
      <ThemeProvider defaultTheme="system">
        <TestConsumer />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
