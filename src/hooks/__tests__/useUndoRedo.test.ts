import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUndoRedo } from '../useUndoRedo';
import { useAppStore } from '@/store';

// Mock undo/redo functions
const mockUndo = vi.fn();
const mockRedo = vi.fn();

// Store the original temporal to restore later
const originalTemporal = useAppStore.temporal;

beforeEach(() => {
  mockUndo.mockClear();
  mockRedo.mockClear();

  // Mock temporal.getState to return our mock undo/redo
  useAppStore.temporal = {
    ...originalTemporal,
    getState: () => ({
      ...originalTemporal.getState(),
      undo: mockUndo,
      redo: mockRedo,
    }),
  } as typeof originalTemporal;
});

afterEach(() => {
  useAppStore.temporal = originalTemporal;
});

describe('useUndoRedo', () => {
  it('calls undo when Ctrl+Z is pressed', () => {
    renderHook(() => useUndoRedo());

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
    );

    expect(mockUndo).toHaveBeenCalledTimes(1);
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('calls redo when Ctrl+Shift+Z is pressed', () => {
    renderHook(() => useUndoRedo());

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      })
    );

    expect(mockRedo).toHaveBeenCalledTimes(1);
    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('calls undo when Meta+Z is pressed (Mac)', () => {
    renderHook(() => useUndoRedo());

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true })
    );

    expect(mockUndo).toHaveBeenCalledTimes(1);
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('calls redo when Meta+Shift+Z is pressed (Mac)', () => {
    renderHook(() => useUndoRedo());

    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      })
    );

    expect(mockRedo).toHaveBeenCalledTimes(1);
    expect(mockUndo).not.toHaveBeenCalled();
  });

  it('does NOT call undo/redo when plain "z" is pressed without Ctrl/Meta', () => {
    renderHook(() => useUndoRedo());

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', bubbles: true })
    );

    expect(mockUndo).not.toHaveBeenCalled();
    expect(mockRedo).not.toHaveBeenCalled();
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() => useUndoRedo());

    unmount();

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true })
    );

    expect(mockUndo).not.toHaveBeenCalled();
    expect(mockRedo).not.toHaveBeenCalled();
  });
});
