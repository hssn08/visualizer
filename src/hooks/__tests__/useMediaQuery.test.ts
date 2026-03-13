import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

describe('useMediaQuery', () => {
  let listeners: Map<string, ((e: MediaQueryListEvent) => void)[]>;
  let matchesMap: Map<string, boolean>;

  beforeEach(() => {
    listeners = new Map();
    matchesMap = new Map();

    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
      if (!listeners.has(query)) listeners.set(query, []);

      const mql = {
        matches: matchesMap.get(query) ?? false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            listeners.get(query)!.push(handler);
          }
        }),
        removeEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            const arr = listeners.get(query)!;
            const idx = arr.indexOf(handler);
            if (idx >= 0) arr.splice(idx, 1);
          }
        }),
        dispatchEvent: vi.fn(),
      };
      return mql as unknown as MediaQueryList;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true when media query matches', () => {
    matchesMap.set('(min-width: 768px)', true);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('returns false when media query does not match', () => {
    matchesMap.set('(min-width: 768px)', false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('registers a "change" event listener on mount', () => {
    renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(listeners.get('(min-width: 768px)')!.length).toBe(1);
  });

  it('updates when the media query changes', () => {
    matchesMap.set('(min-width: 768px)', true);
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(true);

    // Simulate viewport shrinking below 768px
    act(() => {
      const handlers = listeners.get('(min-width: 768px)')!;
      for (const handler of handlers) {
        handler({ matches: false } as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(false);
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(listeners.get('(min-width: 768px)')!.length).toBe(1);
    unmount();
    expect(listeners.get('(min-width: 768px)')!.length).toBe(0);
  });
});
